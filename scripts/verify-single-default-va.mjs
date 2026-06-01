import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const accountDetailsPath = resolve('src/sections/accounts/view/account-details-view.tsx');
const accountsMockPath = resolve('src/mocks/accounts.ts');

const accountDetailsSource = readFileSync(accountDetailsPath, 'utf8');
const accountsMockSource = readFileSync(accountsMockPath, 'utf8');

assert.doesNotMatch(
  accountDetailsSource,
  /handleCreateVa|createVirtualAccount|创建 VA|VA 创建请求/,
  'Global Account details should not expose manual VA creation.'
);

const globalAccountIds = [...accountsMockSource.matchAll(/id: '(ga-\d+)'/g)].map(
  ([, accountId]) => accountId
);
const virtualAccountGlobalIds = [
  ...accountsMockSource.matchAll(/globalAccountId: '(ga-\d+)'/g),
].map(([, accountId]) => accountId);

assert.ok(globalAccountIds.length > 0, 'Expected Global Account mock records.');

for (const accountId of globalAccountIds) {
  assert.equal(
    virtualAccountGlobalIds.filter((id) => id === accountId).length,
    1,
    `Global Account ${accountId} should have exactly one default VA.`
  );
}

console.log('Single default VA behavior verified');
