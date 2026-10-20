import { redirect } from 'next/navigation';

export default function TeacherStudentsRedirect() {
  redirect('/dashboard/faculty/students');
}
