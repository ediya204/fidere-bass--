import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const entityViewPath = resolve('src/sections/entities/view/entities-view.tsx');
const entityDialogPath = resolve('src/sections/entities/entity-detail-dialog.tsx');
const viewSource = readFileSync(entityViewPath, 'utf8');
const dialogSource = readFileSync(entityDialogPath, 'utf8');

assert.doesNotMatch(
  viewSource,
  /DetailDrawer/,
  'EntitiesView should not use DetailDrawer for entity details.'
);
assert.match(
  viewSource,
  /EntityDetailDialog/,
  'EntitiesView should render the entity detail Dialog component.'
);
assert.match(
  dialogSource,
  /@mui\/material\/Dialog/,
  'EntityDetailDialog should render entity details in a MUI Dialog.'
);
assert.match(
  dialogSource,
  /DialogContent/,
  'EntityDetailDialog should have a scrollable content area.'
);
assert.match(dialogSource, /DialogActions/, 'EntityDetailDialog should keep footer actions.');
assert.match(dialogSource, /StatusChip/, 'EntityDetailDialog should keep StatusChip for statuses.');
