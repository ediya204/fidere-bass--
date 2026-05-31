# 交易流水

## 页面字段
- 列表：Reference ID、类型、金额、状态、来源、目标、创建时间。
- 详情：基础信息、金额/费用/汇率、收付款方、状态 Timeline、失败原因。

## Mock 数据结构
- `Transaction` 包含 `timeline`、`errorReason`、`exchangeRate`。

## 组件调用方式
- `DataTable` 支持搜索。
- `DetailDrawer` 展示详情。
- MUI `Timeline` 展示状态变化。

## 操作逻辑
- 支持按状态筛选和关键字搜索。
- 点击行打开详情 Drawer。

## 状态流程
- 覆盖 `pending`、`processing`、`completed`、`failed`、`reversed`。
