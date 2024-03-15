const { Controller } = require('egg');
const moment = require('moment');
class BillController extends Controller {
  async add() {
    const { ctx, app } = this;
    const {
      amount,
      type_id,
      type_name,
      date,
      pay_type,
      remark = '',
    } = ctx.request.body;

    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }

    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '添加成功',
        data: null,
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
  async list() {
    const { ctx, app } = this;
    const { date, type_id = 'all', page = 1, page_size = 5 } = ctx.query;
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      // 拿到当前用户的所有账单
      const list = await ctx.service.bill.list(user_id);

      // 过滤出符合条件的账单
      const _list = list.filter(item => {
        if (type_id !== 'all') {
          return (
            moment(Number(item.date)).format('YYYY-MM') === date &&
            type_id === item.type_id
          );
        }
        return moment(Number(item.date)).format('YYYY-MM') === date;
      });
      // 根据日期将其分类
      const listMap = _list
        .reduce((cur, item) => {
          const date = moment(Number(item.date)).format('YYYY-MM-DD');
          // 获取当前日期在cur中的索引
          const _index = cur.findIndex(_item => _item.date === date);
          // 如果当前日期已经存在，则push到当前日期的数组中
          if (cur && cur.length && _index > -1) {
            cur[_index].bills.push(item);
          }
          // 如果当前日期不存在，则新增一个对象
          if (cur && cur.length && _index === -1) {
            cur.push({
              date,
              bills: [item],
            });
          }
          // 如果cur为空，则新增第一个数组
          if (!cur.length) {
            cur.push({
              date,
              bills: [item],
            });
          }
          return cur;
        }, [])
        .sort((a, b) => moment(b.date) - moment(a.date)); // 将数组按日期排序

      // 分页
      const filterList = listMap.slice(
        (page - 1) * page_size,
        page * page_size
      );
      // 计算当月总收入和支出
      // 获取当月所有的账单信息
      const allList = filterList.filter(item => {
        return moment(Number(item.date)).format('YYYY-MM') === date;
      });
      // 计算总支出
      const totalExpense = allList.reduce((cur, item) => {
        if (item.pay_type === 1) {
          return cur + item.amount;
        }
        return cur;
      }, 0);
      //   计算总收入
      const totalIncome = allList.reduce((cur, item) => {
        if (item.pay_type === 2) {
          return cur + item.amount;
        }
        return cur;
      }, 0);

      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          totalExpense,
          totalIncome,
          totalPage: Math.ceil(listMap.length / page_size),
          list: filterList || [],
        },
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
  async detail() {
    const { ctx, app } = this;
    const { id = '' } = ctx.query;
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return;
    const user_id = decode.id;
    if (!id) {
      ctx.body = {
        code: 400,
        msg: '订单id不能为空',
        data: null,
      };
      return;
    }
    try {
      const detail = await ctx.service.bill.detail(id, user_id);
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: detail,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
  async update() {
    const { ctx, app } = this;
    const {
      id,
      amount,
      type_id,
      type_name,
      date,
      pay_type,
      remark = '',
    } = ctx.request.body;
    console.log(id, amount, type_id, type_name, date, pay_type);
    if (!amount || !type_id || !type_name || !date || !pay_type || !id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id,
      });
      ctx.body = {
        code: 200,
        msg: '更新成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;
    if (!id) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;
      await ctx.service.bill.delete(id, user_id);
      ctx.body = {
        code: 200,
        msg: '删除成功',
        data: null,
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
  async data() {
    const { ctx, app } = this;
    const { date = '' } = ctx.query;
    if (!date) {
      ctx.body = {
        code: 400,
        msg: '参数错误',
        data: null,
      };
      return;
    }
    try {
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      const user_id = decode.id;

      // 获取账单表中的账单数据
      const list = await ctx.service.bill.list(user_id);
      // 根据时间参数,筛选出当月所有的账单
      const start = moment(date).startOf('month').unix() * 1000;
      const end = moment(date).endOf('month').unix() * 1000;
      const _list = list.filter(
        item => Number(item.date) >= start && Number(item.date) <= end
      );

      const totalExpense = _list.reduce((cur, item) => {
        if (item.pay_type === 1) {
          return cur + Number(item.amount);
        }
        return cur;
      }, 0);
      const totalIncome = _list.reduce((cur, item) => {
        if (item.pay_type === 2) {
          return cur + Number(item.amount);
        }
        return cur;
      }, 0);

      let total_data = _list.reduce((cur, item) => {
        const index = cur.findIndex(v => v.type_id === item.type_id);
        // 如果当前类型不存在，则新增一个对象
        if (index === -1) {
          cur.push({
            type_id: item.type_id,
            type_name: item.type_name,
            pay_type: item.pay_type,
            number: Number(item.amount),
          });
        }
        // 如果当前类型存在，则将number相加
        if (index > -1) {
          cur[index].number += Number(item.amount);
        }
        return cur;
      }, []);
      total_data = total_data.map(item => {
        item.number = Number(Number(item.number).toFixed(2));
        return item;
      });
      ctx.body = {
        code: 200,
        msg: '请求成功',
        data: {
          total_expense: Number(totalExpense).toFixed(2),
          total_income: Number(totalIncome).toFixed(2),
          total_data: total_data || [],
        },
      };
    } catch (error) {
      ctx.body = {
        code: 500,
        msg: '服务器错误',
        data: null,
      };
    }
  }
}
module.exports = BillController;
