# 实体与 KYB

## 页面字段
- 实体：Entity ID、名称、类型、国家/地区、邮箱、状态、KYB 状态、创建时间。
- 详情：基础资料、KYB 审核信息、关联 Global Account。

## Mock 数据结构
- `Entity` 记录实体基础信息。
- `KybRecord` 记录文件、审核方、时间线、驳回原因。

## 组件调用方式
- `ActionBar` 承载创建实体表单。
- `DataTable` 展示实体列表。
- `DetailDrawer` 展示实体详情和 KYB 信息。

## 操作逻辑
- 创建实体生成 `draft`。
- 提交 KYB 后实体变为 `submitted`。
- Demo 通过按钮把实体和 KYB 状态推进到 `active/approved`。

## 状态流程
- `draft -> submitted -> pending -> approved/active`。
- 驳回样例保留 `rejected` 和驳回原因。
