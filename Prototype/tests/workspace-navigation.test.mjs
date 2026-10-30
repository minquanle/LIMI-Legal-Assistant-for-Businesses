import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveWorkspaceView} from '../dist/workspace-navigation.js';
test('reviewers stay in the platform workspace and land on the overview',()=>{
 for(const view of ['overview','admin','changes','discovery','account','laws','feedback'])assert.equal(resolveWorkspaceView(view,{authenticated:true,reviewer:true}),view);
 for(const view of ['companies','dashboard','checklist','alerts','profile','lookup',null])assert.equal(resolveWorkspaceView(view,{authenticated:true,reviewer:true}),'overview');
});
test('company access does not grant platform review and logged-out navigation needs login',()=>{
 assert.equal(resolveWorkspaceView('admin',{authenticated:true,reviewer:false}),'companies');
 assert.equal(resolveWorkspaceView('changes',{authenticated:true,reviewer:false}),'companies');
assert.equal(resolveWorkspaceView('discovery',{authenticated:true,reviewer:false}),'companies');
 assert.equal(resolveWorkspaceView('overview',{authenticated:true,reviewer:false}),'companies');
 for(const view of ['dashboard','checklist','alerts','profile','feedback'])assert.equal(resolveWorkspaceView(view,{authenticated:true,reviewer:false}),view);
 assert.equal(resolveWorkspaceView('checklist',{authenticated:false}),'account');
 assert.equal(resolveWorkspaceView('laws',{authenticated:false}),'laws');
 assert.equal(resolveWorkspaceView('lookup',{authenticated:true,reviewer:false,canCreateCompany:true}),'lookup');
});
