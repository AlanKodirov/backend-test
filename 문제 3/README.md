# 문제 3

사내에서 쓰이는 BO(Back office) 서비스를 개발하려고 합니다.

1. 로그인방식인 OAuth와 JWT 둘중에 어느것을 사용하여 개발을 하실건가요?
2. 둘중 선택한 이유와 장점에 대해 설명해주세요
3. 구현 방법을 서술해 주세요 (다이어그램등을 활용하셔서 첨부하셔도 좋습니다)

---

### 💡 추가질문 - 실제로 구현해본 경험이 있다면, 해당 구현 경험을 서술해주세요

다음과 같은 이유로 백오피스(BO) 서비스에서 인증을 위해 JWT 대신 OAuth를 선택합니다.

1️. OAuth는 엔터프라이즈 애플리케이션에 더 안전합니다

OAuth는 업계 표준 인증 프로토콜이며, 대규모 조직에서 안전하게 인증 및 권한 부여를 처리하는 데 사용됩니다.
OAuth를 사용하면 백오피스 서비스에서 사용자 비밀번호를 직접 다룰 필요가 없으며, 비밀번호 유출 위험이 줄어듭니다.

2. SSO(Single Sign-On) 지원으로 편리함 제공
   많은 기업이 Google, Microsoft 등의 SSO 솔루션을 사용합니다.
   OAuth를 사용하면 직원들이 기존 회사 계정을 사용하여 로그인할 수 있어 새로운 비밀번호를 만들 필요가 없습니다.
   예시: Google OAuth를 통해 직원들이 회사 이메일로 로그인할 수 있습니다.

3️. 중앙 집중식 사용자 관리(접근 제어 강화)
OAuth를 사용하면 사용자 계정 및 권한을 중앙에서 관리할 수 있습니다.
직원이 퇴사하면, OAuth 제공자(Google, Microsoft)에서 계정을 비활성화하면 바로 접근이 차단됩니다.
반면, JWT만 사용하면 별도의 사용자 데이터베이스를 유지해야 하고, 수동으로 계정을 삭제해야 합니다.

4️. OAuth는 인증(Authentication)과 권한 부여(Authorization)를 모두 제공
OAuth 2.0을 사용하면 백오피스 서비스가 특정 사용자 데이터에 제한된 접근 권한을 요청할 수 있습니다.
예시: 백오피스 서비스가 CRM(Salesforce) API에 접근해야 한다면, OAuth를 사용하여 안전하게 인증 및 권한 부여를 할 수 있습니다.

최종 요약: OAuth는 수동 사용자 관리가 필요 없이 SSO, 중앙 집중식 사용자 관리 및 더 나은 보안을 제공하므로 백오피스 서비스에 더 적합한 선택입니다.

## In this example I will implement google oauth in sveltekit

## /src/lib/server/action/oauth.ts

import { GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_CLIENT_SECRET } from "$env/static/private";
import { google } from "googleapis";
import { redirect } from "@sveltejs/kit";

export const googleOAuth = async ({ url }: { url: URL }) => {
const client = new google.auth.OAuth2(GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_CLIENT_SECRET, `${url.origin}/api/auth/oauth/google`);
const authorizeURL = client.generateAuthUrl({
access_type: "offline",
scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "openid"],
prompt: "consent",
state: JSON.stringify({
pathname: url.pathname,
}),
});

redirect(302, authorizeURL);
};

## /src/routes/api/auth/oauth/google/+server.ts

export const GET = async ({ url, cookies }) => {
const code = url.searchParams.get("code");

if (!code) {
logger.error("[ api/auth/oauth/google ] Invalid request", { code });

    return errorResponse(400, {
      code: StatusCode.INVALID_REQUEST,
      message: "Invalid request",
    });

}
const redirectionURL = url.href.split("?")[0];

async function getGoogleUserInfo(code: string, redirectionURL: string) {
const oauthClient = new google.auth.OAuth2(GOOGLE_AUTH_CLIENT_ID, GOOGLE_AUTH_CLIENT_SECRET, redirectionURL);
const getTokenResponse = await oauthClient.getToken(code);

const accessToken = getTokenResponse.tokens.access_token;

const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });

const userInfo: oauth2_v2.Schema$Userinfo = await userInfoResponse.json();

return {
id: userInfo.id,
email: userInfo.email,
name: userInfo.name,
picture: userInfo.picture,
};
}

const userData = await getGoogleUserInfo(code, redirectionURL);

if (!userData.id) {
return errorResponse(400, {
code: StatusCode.INVALID_REQUEST,
message: "Invalid request",
});
}

const oauth = await getOAuth(userData.id, "google");

// 신규 로그인 핸들링
if (!oauth) {
const session = await mongoose.startSession();

    const user = new UserModel({
      nickname: userData.name,
      email: userData.email,
      profileImageUrl: userData.picture,
      roles: [],
    });
    const oauth = new OAuthModel({
      authId: userData.id,
      provider: "google",
      user: user._id,
    });

    await session.withTransaction(async () => {
      await user.save({ session });
      await oauth.save({ session });
    });
    await session.commitTransaction();
    session.endSession();

    setAuthTokens(cookies, user!);
    return redirect(303, "/home?toast=welcomeLogin");

}

// 기존 로그인 핸들링
if (!oauth.user) {
return errorResponse(404, {
code: StatusCode.NO_DATA_FOUND,
message: `Invalid request. pleast contact to admin\n${oauth.authId}`,
});
}
setAuthTokens(cookies, oauth.user);

return redirect(303, `/home?toast=welcomeLogin`);
};
