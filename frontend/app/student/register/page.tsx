import { redirect } from 'next/navigation';

export default function StudentRegisterRedirect() {
  redirect('/dashboard/student/register');
}
