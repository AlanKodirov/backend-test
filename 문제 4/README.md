# 문제 4

아래의 요구조건에 맞는 설계를 진행하고, 이유를 설명해주세요

작은 스타트업에서 BO 서비스에서 통계 서비스를 개발하여 합니다

1. 각 콘텐츠의 유저의 클릭수, 좋아요수를 보여주는 그래프를 그려야 합니다
2. 클릭과 좋아요 수는 BO의 대시보드에서 확인이 가능하며, 새로고침 버튼을 눌러서 갱신 가능합니다
3. 그래프는 일일 단위로 합계로 표시됩니다

---

### 💡 추가질문 1. - 실제로 구현해본 경험이 있다면, 해당 구현 경험을 서술해주세요

### 💡 추가질문 2. - 유저가 클릭을 조작하기위해 빠르게 연타를 한다면, 어떻게 방지할수 있을까요?

## SvelteKit을 사용한 통계 대시보드 구현

이 프로젝트에서는 SvelteKit을 사용하여 콘텐츠 클릭/좋아요 통계를 저장하고 시각화하는 대시보드를 구현합니다.

클릭/좋아요 수를 데이터베이스에 저장
일 단위 통계를 집계하여 대시보드에 표시
SvelteKit 기반 대시보드에서 실시간 그래프 표시
Redis를 사용한 요청 속도 제한 (스팸 방지)

백엔드 (SvelteKit API)
데이터를 저장하고 통계를 제공하는 API를 구축합니다.

1. 의존성 설치
   npm install @prisma/client bcrypt redis
   npx prisma init

2. 데이터베이스 스키마 (Prisma)

## prisma/schema.prisma:

model User {
id Int @id @default(autoincrement())
email String @unique
createdAt DateTime @default(now())
}

model Content {
id Int @id @default(autoincrement())
title String
}

model UserAction {
id Int @id @default(autoincrement())
userId Int
contentId Int
actionType String // 'click' 또는 'like'
createdAt DateTime @default(now())

user User @relation(fields: [userId], references: [id])
content Content @relation(fields: [contentId], references: [id])
}

model DailyStats {
id Int @id @default(autoincrement())
contentId Int
date DateTime
clicks Int @default(0)
likes Int @default(0)

content Content @relation(fields: [contentId], references: [id])
}

3. 클릭/좋아요 저장 API

## src/routes/api/click/+server.ts:

import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function POST({ request }) {
const { userId, contentId, actionType } = await request.json();

if (!['click', 'like'].includes(actionType)) {
return json({ error: '잘못된 요청입니다' }, { status: 400 });
}

// 사용자 행동 저장
await prisma.userAction.create({
data: { userId, contentId, actionType },
});

// 일일 통계 업데이트
await prisma.dailyStats.upsert({
where: { contentId_date: { contentId, date: new Date().toISOString().split('T')[0] } },
update: { [actionType === 'click' ? 'clicks' : 'likes']: { increment: 1 } },
create: { contentId, date: new Date(), clicks: actionType === 'click' ? 1 : 0, likes: actionType === 'like' ? 1 : 0 },
});

return json({ success: true });
}

4. 통계 데이터 가져오기 API

## src/routes/api/stats/+server.ts:

import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';

export async function GET({ url }) {
const contentId = Number(url.searchParams.get('contentId'));

const stats = await prisma.dailyStats.findMany({
where: { contentId },
orderBy: { date: 'asc' }
});

return json(stats);
}

스팸 방지를 위한 Redis 속도 제한

Redis를 활용하여 빠른 연타(클릭 조작)를 방지합니다.

## 미들웨어로 속도 제한 적용

## src/hooks.server.ts:

import Redis from 'ioredis';

const redis = new Redis();

export async function handle({ event, resolve }) {
const ip = event.request.headers.get('x-forwarded-for') || event.request.headers.get('cf-connecting-ip');

const key = `rate:${ip}`;
const count = await redis.incr(key);

if (count > 5) {
return new Response('요청이 너무 많습니다.', { status: 429 });
}

redis.expire(key, 1); // 1초마다 초기화
return resolve(event);
}

## 저는 SvelteKit에서 Chart.js를 사용하여 대시보드 차트를 구현한 경험이 있습니다.

## BO 서비스에서는 MongoDB를 데이터베이스로 사용했으며, 대시보드에서 사용자 일일 및 월간 포인트, 조회수, 그리고 프리미엄 조회수를 표시했습니다.

import { VideoHistoryModel } from "$db/videoHistoryModel";
import { getTotalHistories } from "$lib/apis/getters";
import { serializeNonPOJOs } from "$lib/utility";

export const GET = async ({ url }) => {
const page = Number(url.searchParams.get("page") || 1);
const groupBy = url.searchParams.get("groupBy") || "day";
const startDate = url.searchParams.get("startDate");
const endDate = url.searchParams.get("endDate");
const sortBy = url.searchParams.get("sortBy");
const sort = sortBy === "asc" ? 1 : -1;

let totalHistories =
groupBy === "day"
? await getTotalHistories({ startDate, endDate }).then((data) =>
serializeNonPOJOs(data)
)
: await VideoHistoryModel.aggregate([
{
$project: {
              month: { $substr: ["$date", 0, 7] },
report: "$report",
              inviteEvent: "$inviteEvent",
},
},
{
$group: {
              _id: "$month",
view: { $sum: "$report.views" },
point: { $sum: "$report.point" },
premiumView: { $sum: "$report.premiumViews" },
// 실제 유저포인트(본인 친추 이벤트 포함)
realPoint: { $sum: "$report.realPoint" },
invitePoint: { $sum: { $multiply: ["$report.realPoint", "$inviteEvent.ratio"] }}
            },
          },
          {
            $addFields: {
              total: { $multiply: ["$realPoint", 5 / 4] },
},
},
{ $sort: { \_id: sort } },
]).then((data) => serializeNonPOJOs(data));

const userPoints = await VideoHistoryModel.aggregate([
{
$project: {
        month: { $substr: ["$date", 0, 7] },
report: "$report",
        user: "$user",
},
},
{
$lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true }},
{ $match: { user: { $exists: true } } },
    {
      $group: {
        _id: "$month",
userPoint: { $sum: "$report.point" },
},
},
{ $sort: { \_id: sort } },
])

return Response.json({
success: true,
data: {
totalHistories,
userPoints,
}
});
};
