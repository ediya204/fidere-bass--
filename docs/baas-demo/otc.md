# OTC 操作

## 页面字段
- 表单：账户、方向、金额、币种对。
- 历史：Reference ID、账户、方向、卖出金额、获得金额、汇率、状态、创建时间。

## Mock 数据结构
- `OtcTrade` 保存兑换成交。
- `Transaction` 同步生成 `otc_buy` 或 `otc_sell` 流水。

## 组件调用方式
- `ActionBar` 承载 OTC 表单。
- `ConfirmDialog` 二次确认。
- `DataTable` 展示历史。

## 操作逻辑
- 卖出 USDT：`USDT -> USD`。
- 买入 USDT：`USD -> USDT`。
- 提交后按 mock 汇率立即成交。

## 状态流程
- 新 OTC 交易为 `completed`。
