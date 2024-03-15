'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const moment = require('moment');

const { Controller } = require('egg');

class UploadController extends Controller {
  async upload() {
    const { ctx } = this;
    const file = ctx.request.files[0];
    let uploadDir = '';
    try {
      const f = fs.readFileSync(file.filepath);
      // 1.获取当前日期
      const day = moment(new Date()).format('YYYYMMDD');
      // 2.创建图片保存的路径
      const dir = path.join(this.config.uploadDir, day);
      const date = Date.now();
      await mkdirp.mkdirp(dir); // 不存在就创建目录
      // 返回图片保存的路径
      uploadDir = path.join(dir, date + path.extname(file.filename));
      fs.writeFileSync(uploadDir, f);
    } finally {
      // 清除临时文件
      ctx.cleanupRequestFiles();
    }
    ctx.body = {
      code: 200,
      msg: '上传成功',
      data: uploadDir.replace(/app/g, ''),
    };
  }
}
module.exports = UploadController;
