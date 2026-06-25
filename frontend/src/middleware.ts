import { NextResponse, type NextRequest } from "next/server";

// 認証ガード。
// access_token Cookie が無ければ /login にリダイレクトする。
// ※ ここでは「トークンの有無」だけを見る軽量チェック。
//    トークンの正当性検証は各 API（backend の jwtVerify）が行う。
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // /login・/signup・静的ファイル・_next を除く全ページを保護する
  matcher: ["/((?!login|signup|_next|.*\\.).*)"],
};
