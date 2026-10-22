"""
Supabase Database Adapter for SnapPresent
Provides a MongoDB-compatible collection interface backed by Supabase PostgreSQL.
Enables seamless switching between MongoDB and Supabase without rewriting business logic.
"""

import os
import uuid
import re
from datetime import datetime
from supabase import create_client, Client


class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = str(inserted_id)


class UpdateResult:
    def __init__(self, matched_count=1, modified_count=1):
        self.matched_count = matched_count
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count=1):
        self.deleted_count = deleted_count


class SupabaseCursor(list):
    """Cursor that behaves like a pymongo cursor (iterable, indexable, sortable)"""
    def sort(self, field, direction=1):
        reverse = (direction == -1)
        try:
            return SupabaseCursor(sorted(self, key=lambda x: str(x.get(field, "")).lower(), reverse=reverse))
        except Exception:
            return self


class SupabaseCollection:
    def __init__(self, client: Client, table_name: str):
        self.client = client
        self.table_name = table_name

    def _normalize_doc(self, doc: dict) -> dict:
        if not doc or not isinstance(doc, dict):
            return doc
        d = dict(doc)
        if "id" in d and "_id" not in d:
            d["_id"] = str(d["id"])
        elif "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        return d

    def _apply_filter_to_query(self, query_builder, filter_dict: dict):
        if not filter_dict:
            return query_builder

        for key, val in filter_dict.items():
            col_name = "id" if key == "_id" else key

            if isinstance(val, dict):
                # Handle operators
                if "$ne" in val:
                    ne_val = str(val["$ne"]) if key in ("_id", "id") else val["$ne"]
                    query_builder = query_builder.neq(col_name, ne_val)
                elif "$regex" in val:
                    pattern = val["$regex"]
                    # Convert simple regex to ilike if feasible
                    clean_pattern = pattern.replace("^", "").replace("$", "")
                    query_builder = query_builder.ilike(col_name, f"%{clean_pattern}%")
                elif "$exists" in val:
                    if val["$exists"]:
                        query_builder = query_builder.not_.is_(col_name, "null")
                    else:
                        query_builder = query_builder.is_(col_name, "null")
            elif key == "$or":
                # Fallback: evaluate in memory after fetching
                pass
            else:
                str_val = str(val) if key in ("_id", "id") else val
                query_builder = query_builder.eq(col_name, str_val)

        return query_builder

    def _doc_matches_in_memory(self, doc: dict, filter_dict: dict) -> bool:
        if not filter_dict:
            return True

        for key, val in filter_dict.items():
            if key == "$or" and isinstance(val, list):
                if not any(self._doc_matches_in_memory(doc, sub) for sub in val):
                    return False
                continue

            doc_key = "_id" if key == "_id" else key
            doc_val = doc.get(doc_key, doc.get("id" if key == "_id" else key))

            if isinstance(val, dict):
                if "$ne" in val:
                    cmp_val = str(val["$ne"]) if key in ("_id", "id") else val["$ne"]
                    if str(doc_val) == str(cmp_val):
                        return False
                if "$regex" in val:
                    flags = re.IGNORECASE if "i" in val.get("$options", "") else 0
                    if not re.search(val["$regex"], str(doc_val or ""), flags):
                        return False
                if "$exists" in val:
                    exists = doc_val is not None
                    if exists != val["$exists"]:
                        return False
            else:
                if key in ("_id", "id"):
                    if str(doc_val) != str(val):
                        return False
                elif doc_val != val:
                    return False

        return True

    def find_one(self, filter_dict: dict = None, projection: dict = None):
        filter_dict = filter_dict or {}
        try:
            qb = self.client.table(self.table_name).select("*")

            # Apply top-level exact filters where possible
            direct_filters = {k: v for k, v in filter_dict.items() if not isinstance(v, dict) and k != "$or"}
            qb = self._apply_filter_to_query(qb, direct_filters)

            res = qb.execute()
            rows = res.data or []

            for row in rows:
                norm = self._normalize_doc(row)
                if self._doc_matches_in_memory(norm, filter_dict):
                    if projection and isinstance(projection, dict):
                        # Apply projection (e.g. {"embedding": 0, "password": 0})
                        for p_k, p_v in projection.items():
                            if p_v == 0:
                                norm.pop(p_k, None)
                    return norm

            return None
        except Exception as e:
            print(f"[SupabaseCollection.find_one] {self.table_name} error: {e}")
            return None

    def find(self, filter_dict: dict = None, projection: dict = None):
        filter_dict = filter_dict or {}
        try:
            qb = self.client.table(self.table_name).select("*")

            direct_filters = {k: v for k, v in filter_dict.items() if not isinstance(v, dict) and k != "$or"}
            qb = self._apply_filter_to_query(qb, direct_filters)

            res = qb.execute()
            rows = res.data or []

            matched = []
            for row in rows:
                norm = self._normalize_doc(row)
                if self._doc_matches_in_memory(norm, filter_dict):
                    if projection and isinstance(projection, dict):
                        for p_k, p_v in projection.items():
                            if p_v == 0:
                                norm.pop(p_k, None)
                    matched.append(norm)

            return SupabaseCursor(matched)
        except Exception as e:
            print(f"[SupabaseCollection.find] {self.table_name} error: {e}")
            return SupabaseCursor([])

    def insert_one(self, document: dict):
        doc = dict(document)
        # Ensure ID exists
        if "_id" in doc and "id" not in doc:
            doc["id"] = str(doc.pop("_id"))
        elif "id" not in doc:
            doc["id"] = uuid.uuid4().hex[:24]

        inserted_id = doc["id"]

        try:
            res = self.client.table(self.table_name).insert(doc).execute()
            return InsertResult(inserted_id)
        except Exception as e:
            print(f"[SupabaseCollection.insert_one] {self.table_name} error: {e}")
            raise e

    def update_one(self, filter_dict: dict, update_doc: dict):
        try:
            # Find the target document first to handle Mongo update operators like $set, $push
            target = self.find_one(filter_dict)
            if not target:
                return UpdateResult(matched_count=0, modified_count=0)

            target_id = str(target.get("id") or target.get("_id"))
            current_data = dict(target)

            # Handle $set
            if "$set" in update_doc:
                for k, v in update_doc["$set"].items():
                    if k.startswith("students.$."):
                        # Handling array element update in attendance_records
                        field_name = k.replace("students.$.", "")
                        sid_filter = filter_dict.get("students.student_id")
                        if "students" in current_data and isinstance(current_data["students"], list):
                            for s in current_data["students"]:
                                if s.get("student_id") == sid_filter:
                                    s[field_name] = v.isoformat() if isinstance(v, datetime) else v
                    else:
                        current_data[k] = v.isoformat() if isinstance(v, datetime) else v

            # Handle $push
            if "$push" in update_doc:
                for k, v in update_doc["$push"].items():
                    if k not in current_data or not isinstance(current_data[k], list):
                        current_data[k] = []
                    item = dict(v) if isinstance(v, dict) else v
                    if isinstance(item, dict) and "marked_at" in item and isinstance(item["marked_at"], datetime):
                        item["marked_at"] = item["marked_at"].isoformat()
                    current_data[k].append(item)

            # Clean internal fields for Postgres update
            update_payload = {k: v for k, v in current_data.items() if k not in ("_id",)}
            if "id" in update_payload:
                update_payload["id"] = str(update_payload["id"])

            self.client.table(self.table_name).update(update_payload).eq("id", target_id).execute()
            return UpdateResult(matched_count=1, modified_count=1)

        except Exception as e:
            print(f"[SupabaseCollection.update_one] {self.table_name} error: {e}")
            return UpdateResult(matched_count=0, modified_count=0)

    def delete_one(self, filter_dict: dict):
        try:
            target = self.find_one(filter_dict)
            if not target:
                return DeleteResult(deleted_count=0)

            target_id = str(target.get("id") or target.get("_id"))
            self.client.table(self.table_name).delete().eq("id", target_id).execute()
            return DeleteResult(deleted_count=1)
        except Exception as e:
            print(f"[SupabaseCollection.delete_one] {self.table_name} error: {e}")
            return DeleteResult(deleted_count=0)

    def count_documents(self, filter_dict: dict = None):
        filter_dict = filter_dict or {}
        try:
            if not filter_dict:
                res = self.client.table(self.table_name).select("*", count="exact").execute()
                return res.count or len(res.data or [])
            matches = self.find(filter_dict)
            return len(matches)
        except Exception as e:
            print(f"[SupabaseCollection.count_documents] {self.table_name} error: {e}")
            return 0

    def distinct(self, field: str):
        try:
            res = self.client.table(self.table_name).select(field).execute()
            rows = res.data or []
            values = set()
            for r in rows:
                v = r.get(field)
                if v:
                    values.add(v)
            return list(values)
        except Exception as e:
            print(f"[SupabaseCollection.distinct] {self.table_name} error: {e}")
            return []


class SupabaseDB:
    """Wrapper that mimics PyMongo's Database instance with collection attributes"""
    def __init__(self, supabase_url: str, supabase_key: str):
        self.client: Client = create_client(supabase_url, supabase_key)
        self._collections = {}

    def __getattr__(self, name: str) -> SupabaseCollection:
        return self[name]

    def __getitem__(self, name: str) -> SupabaseCollection:
        if name not in self._collections:
            self._collections[name] = SupabaseCollection(self.client, name)
        return self._collections[name]
