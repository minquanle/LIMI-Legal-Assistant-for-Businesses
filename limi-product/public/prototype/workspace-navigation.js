// Platform review and company membership are independent permissions.
// Reviewers work on the platform only (overview, obligation review, law changes); company pages are not part of their workspace.
const COMPANY_VIEWS=['companies','dashboard','checklist','alerts','profile','feedback'];
export const REVIEWER_VIEWS=['overview','admin','changes','discovery','account','feedback'];
export function resolveWorkspaceView(requested,{authenticated,reviewer,canCreateCompany=false}){
  if(requested==='laws')return 'laws';
  if(!authenticated)return 'account';
  if(reviewer)return REVIEWER_VIEWS.includes(requested)?requested:'overview';
  if(['account',...COMPANY_VIEWS].includes(requested))return requested;
  if(canCreateCompany&&['lookup','confirm','questions','topics'].includes(requested))return requested;
  return 'companies';
}
