import request from './request';

// 用户登录相关接口

/**
 * 账号密码登录
 * @param data 登录参数
 */
export function loginByPassword(data: {
  account: string;
  password: string;
}) {
  return request('/auth/login/password', 'POST', data);
}

/**
 * 微信登录
 * @param data 微信登录参数
 */
export function loginByWechat(data: {
  code: string;
  encryptedData?: string;
  iv?: string;
}) {
  return request('/auth/login/wechat', 'POST', data);
}

/**
 * 绑定手机号（首次微信登录）
 * @param data 绑定参数
 */
export function bindPhone(data: {
  phone: string;
  password: string;
  token?: string;
}) {
  return request('/auth/bind-phone', 'POST', data);
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request('/auth/user-info', 'GET');
}

/**
 * 退出登录
 */
export function logout() {
  return request('/auth/logout', 'POST');
}

/**
 * 发送验证码
 * @param phone 手机号
 */
export function sendVerifyCode(phone: string) {
  return request('/auth/send-code', 'POST', { phone });
}

/**
 * 验证验证码
 * @param data 验证参数
 */
export function verifyCode(data: {
  phone: string;
  code: string;
}) {
  return request('/auth/verify-code', 'POST', data);
}

/**
 * 重置密码
 * @param data 重置参数
 */
export function resetPassword(data: {
  phone: string;
  code: string;
  newPassword: string;
}) {
  return request('/auth/reset-password', 'POST', data);
}
