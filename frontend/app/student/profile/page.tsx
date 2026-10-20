import { redirect } from 'next/navigation';

export default function StudentProfileRedirect() {
  redirect('/dashboard/student/profile');
}
