import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET: Check active session from HTTP-Only cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('pc02_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let userId = sessionCookie.value;

    // Handle legacy base64 user objects or plain stringified JSON
    if (userId.startsWith('{') || (userId.match(/^[A-Za-z0-9+/=]+$/) && !userId.match(/^\d+$/))) {
      try {
        const decoded = Buffer.from(userId, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.id) {
          userId = parsed.id;
        }
      } catch (e) {
        // Fallback to raw value
      }
    }

    // Convert to number if it's numeric to match schema typing correctly
    const parsedId = /^\d+$/.test(String(userId)) ? parseInt(String(userId), 10) : userId;

    // Verify user still exists in DB
    const { data, error } = await supabase
      .from('qhctv_users')
      .select('*')
      .eq('id', parsedId);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: data[0] });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

// POST: Authenticate user and set HTTP-Only cookie
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu!" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('qhctv_users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim());

    if (error) {
      return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu!" }, { status: 500 });
    }

    if (data && data.length > 0) {
      const user = data[0];
      const serializedUser = String(user.id);

      const cookieStore = await cookies();
      
      // Set the HTTP-Only cookie (secure: false allows local/intranet deployments over plain HTTP)
      cookieStore.set('pc02_session', serializedUser, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours session life
        path: '/',
      });

      // Write system log
      await supabase.from('qhctv_system_logs').insert([
        {
          user_name: user.name,
          action: "Đăng nhập hệ thống (HTTP-Only Session)",
          module: "Hệ thống",
        }
      ]);

      return NextResponse.json({ authenticated: true, user });
    } else {
      return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng!" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Logout, clear HTTP-Only cookie
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('pc02_session', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
