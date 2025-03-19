# 문제 2

아래의 요구 사항에 맞는 테이블을 설계하여 ERD를 작성해 주세요

기초 테이블 정의를 바탕으로 작성하며,
유저스토리에 따라 테이블의 수정 및 추가를 하실 수 있습니다

## 기초 테이블 정의

- **user** table은 이름(name), 이메일(email), 패스워드(password), 가입일(created_at)을 가지고 있다.
- **post** table은 글제목(title), 본문(content), 글 작성일(created_at), 작성자(user_id)를 가지고 있다
- **tag** table은 태그명(name), 태그 생성일(created_at)을 가지고있다

### 유저 스토리

- user는 post를 작성할수 있다
- user는 post는 복수의 tag를 추가 할수있다
- user는 탈퇴처리 처리가 가능해야한다
- user가 탈퇴 되더라도, post는 삭제되서는 안된다
- tag로 post를 검색할수 있어야 한다

---

### 💡 추가질문 - 성능을 개선하기 위한 아이디어를 제시해 주세요

CREATE TABLE user (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL
);

CREATE TABLE post (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(255) NOT NULL,
content TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
user_id INT,
FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
);

CREATE TABLE tag (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL UNIQUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_tag (
post_id INT,
tag_id INT,
PRIMARY KEY (post_id, tag_id),
FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
);

## Optimizing for Performance

## 1 Indexing

## Create indexes on frequently queried fields such as email in the user table, created_at in the post and tag tables, and the name field in the tag table.

## 2 Caching

## Use caching mechanisms (like Redis) for frequently accessed data

## 3 Query Optimization:

## If the application grows, consider using a more specialized search engine like Elasticsearch for faster text-based searches.
