import { redirect } from 'next/navigation';

export default function TeacherSessionRedirect() {
  redirect('/dashboard/faculty/session');
}
