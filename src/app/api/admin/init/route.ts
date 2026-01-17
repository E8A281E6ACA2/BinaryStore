import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
export async function POST(request: NextRequest) {
  try {
    // 检查是否已经有管理员账户
    const existingAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (existingAdmins > 0) {
      return NextResponse.json(
        { error: '系统已初始化，无法重复创建管理员账户' },
        { status: 400 }
      );
    }

    // 尝试解析数据，根据Content-Type选择不同的解析方法
    let name, email, password;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // 解析JSON数据
      const jsonData = await request.json();
      name = jsonData.name;
      email = jsonData.email;
      password = jsonData.password;
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // 解析表单数据
      const formData = await request.formData();
      name = formData.get('name') as string;
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    } else {
      // 无法解析的内容类型
      return NextResponse.json(
        { error: '不支持的请求内容类型' },
        { status: 400 }
      );
    }
    // 验证输入
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码长度至少为8位' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 哈希密码
    const hashedPassword = hashPassword(password);

    // 创建管理员账户
    const adminUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // 创建系统默认设置
    await prisma.systemConfig.createMany({
      data: [
        { key: 'r2_account_id', value: '', encrypted: false },
        { key: 'r2_access_key_id', value: '', encrypted: false },
        { key: 'r2_secret_access_key', value: '', encrypted: true },
        { key: 'r2_bucket', value: '', encrypted: false },
        { key: 'r2_endpoint', value: '', encrypted: false },
        { key: 'r2_region', value: 'auto', encrypted: false },
        { key: 'system_name', value: 'BinaryStore', encrypted: false },
        { key: 'system_description', value: '软件下载平台', encrypted: false },
        { key: 'system_logo', value: '', encrypted: false },
        { key: 'system_favicon', value: '', encrypted: false },
        { key: 'smtp_host', value: '', encrypted: false },
        { key: 'smtp_port', value: '587', encrypted: false },
        { key: 'smtp_username', value: '', encrypted: false },
        { key: 'smtp_password', value: '', encrypted: true },
        { key: 'smtp_from', value: '', encrypted: false },
        { key: 'smtp_secure', value: 'false', encrypted: false },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: '管理员账户创建成功',
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('初始化管理员账户失败:', error);
    return NextResponse.json(
      { error: '创建管理员账户失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 添加GET方法以防止直接访问
export async function GET() {
  return NextResponse.json(
    { error: '请使用POST方法创建管理员账户' },
    { status: 405 }
  );
}