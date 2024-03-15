'use strict';

const { Controller } = require('egg');

class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;
    if (!username || !password) {
      ctx.body = {
        code: 500,
        msg: '用户名或密码不能为空',
        data: null,
      };
      return;
    }
    const userInfo = await ctx.service.user.getUserByName(username);
    if (userInfo && userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '用户已存在',
        data: null,
      };
      return;
    }
    //   默认头像
    const defaultAvatar =
      'http://s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png';
    const result = await ctx.service.user.register({
      username,
      password,
      signature: '这个人很懒，什么都没有留下',
      avatar: defaultAvatar,
    });
    if (result) {
      ctx.body = {
        code: 200,
        msg: '注册成功',
        data: null,
      };
    } else {
      ctx.body = {
        code: 500,
        msg: '注册失败',
        data: null,
      };
    }
  }
  async login() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body;

    const userInfo = await ctx.service.user.getUserByName(username);
    //  用户不存在
    if (!userInfo || !userInfo.id) {
      ctx.body = {
        code: 500,
        msg: '用户不存在',
        data: null,
      };
      return;
    }
    //  密码错误
    if (userInfo && password !== userInfo.password) {
      ctx.body = {
        code: 500,
        msg: '账号密码输入错误',
        data: null,
      };
      return;
    }
    // 生成token
    const token = app.jwt.sign(
      {
        id: userInfo.id,
        username: userInfo.username,
        // 过期时间 24 小时
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      },
      app.config.jwt.secret
    );
    ctx.body = {
      code: 200,
      msg: '登录成功',
      data: {
        token,
      },
    };
  }
  async getUserInfo() {
    const { ctx, app } = this;
    const token = ctx.request.header.authorization;
    const decode = app.jwt.verify(token, app.config.jwt.secret);
    const userInfo = await ctx.service.user.getUserByName(decode.username);
    ctx.body = {
      code: 200,
      msg: '获取成功',
      data: {
        ...userInfo,
      },
    };
  }
  async editUserInfo() {
    const { ctx, app } = this;
    const { signature, avatar } = ctx.request.body;
    try {
      let userId;
      const token = ctx.request.header.authorization;
      const decode = app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return;
      userId = decode.id;
      const userInfo = await ctx.service.user.getUserByName(decode.username);
      await ctx.service.user.editUserInfo({
        ...userInfo,
        signature,
        avatar,
      });
      ctx.body = {
        code: 200,
        msg: '更新成功',
        data: {
          id: decode.id,
          signature,
          username: userInfo.username,
          avatar,
        },
      };
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: 500,
        msg: '更新失败',
        data: null,
      };
    }
  }
  async test() {
    const { ctx, app } = this;
    const token = ctx.request.header.authorization;
    const decode = app.jwt.verify(token, app.config.jwt.secret);
    ctx.body = {
      code: 200,
      msg: '获取成功',
      data: {
        ...decode,
      },
    };
  }
}

module.exports = UserController;
