# -*- coding: utf-8 -*-
"""
孕期宝 · 本地管理后台
只读直连 MySQL yunfu，提供用户列表、记录预览、AI 对话查看。
"""
import markdown
from flask import Flask, render_template, request, redirect, url_for, abort
from functools import wraps
import pymysql
from config import (
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    ADMIN_PASSWORD,
    SECRET_KEY,
)

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY


def get_db():
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def require_admin(f):
    """若设置了 ADMIN_PASSWORD，则要求 Basic 认证。"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        if not ADMIN_PASSWORD:
            return f(*args, **kwargs)
        auth = request.authorization
        if not auth or auth.password != ADMIN_PASSWORD:
            from flask import Response
            return Response(
                "需要管理员密码",
                401,
                {"WWW-Authenticate": "Basic realm='Admin'"},
            )
        return f(*args, **kwargs)
    return wrapped


@app.route("/")
@require_admin
def index():
    return redirect(url_for("users"))


@app.route("/users")
@require_admin
def users():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, username, email, user_type, last_menstrual_date, "
                "pregnancy_time, created_at FROM yunfu.user ORDER BY user_id ASC"
            )
            rows = cur.fetchall()
        for r in rows:
            if r.get("last_menstrual_date"):
                r["last_menstrual_date"] = str(r["last_menstrual_date"])
            if r.get("pregnancy_time"):
                r["pregnancy_time"] = str(r["pregnancy_time"])
            if r.get("created_at"):
                r["created_at"] = str(r["created_at"])
        return render_template("users.html", users=rows)
    finally:
        conn.close()


@app.route("/records")
@require_admin
def records():
    user_id = request.args.get("user_id", type=int)
    memo_type = request.args.get("type", "").strip() or None
    conn = get_db()
    try:
        with conn.cursor() as cur:
            sql = (
                "SELECT m.memo_id, m.user_id, m.type, m.photo_title, m.photo_description, "
                "m.created_at, u.username "
                "FROM yunfu.memo m "
                "LEFT JOIN yunfu.user u ON m.user_id = u.user_id "
                "WHERE 1=1"
            )
            params = []
            if user_id:
                sql += " AND m.user_id = %s"
                params.append(user_id)
            if memo_type:
                sql += " AND m.type = %s"
                params.append(memo_type)
            sql += " ORDER BY m.created_at DESC LIMIT 500"
            cur.execute(sql, params or None)
            memos = cur.fetchall()
            for m in memos:
                m["created_at"] = str(m["created_at"]) if m.get("created_at") else ""
            if memo_type == "text":
                for m in memos:
                    cur.execute(
                        "SELECT title, LEFT(content, 80) AS summary FROM yunfu.text WHERE memo_id = %s LIMIT 1",
                        (m["memo_id"],),
                    )
                    row = cur.fetchone()
                    m["summary"] = (row["summary"] or "") if row else ""
                    m["title"] = (row["title"] or "") if row else ""
            elif memo_type == "photo":
                for m in memos:
                    m["summary"] = "多图"
            elif memo_type == "voice":
                for m in memos:
                    cur.execute(
                        "SELECT title FROM yunfu.voice WHERE memo_id = %s LIMIT 1",
                        (m["memo_id"],),
                    )
                    row = cur.fetchone()
                    m["summary"] = (row["title"] or "语音") if row else "语音"
            elif memo_type == "file":
                for m in memos:
                    cur.execute(
                        "SELECT title FROM yunfu.file WHERE memo_id = %s LIMIT 1",
                        (m["memo_id"],),
                    )
                    row = cur.fetchone()
                    m["summary"] = (row["title"] or "文件") if row else "文件"
            else:
                for m in memos:
                    t = m["type"]
                    if t == "text":
                        cur.execute(
                            "SELECT title, LEFT(content, 50) AS summary FROM yunfu.text WHERE memo_id = %s LIMIT 1",
                            (m["memo_id"],),
                        )
                        row = cur.fetchone()
                        m["summary"] = (row["summary"] or "") if row else ""
                        m["title"] = (row["title"] or "") if row else ""
                    elif t == "photo":
                        m["summary"] = "多图"
                    elif t == "voice":
                        cur.execute(
                            "SELECT title FROM yunfu.voice WHERE memo_id = %s LIMIT 1",
                            (m["memo_id"],),
                        )
                        row = cur.fetchone()
                        m["summary"] = (row["title"] or "语音") if row else "语音"
                    elif t == "file":
                        cur.execute(
                            "SELECT title FROM yunfu.file WHERE memo_id = %s LIMIT 1",
                            (m["memo_id"],),
                        )
                        row = cur.fetchone()
                        m["summary"] = (row["title"] or "文件") if row else "文件"
                    else:
                        m["summary"] = ""
        return render_template(
            "records.html",
            records=memos,
            user_id=user_id,
            memo_type=memo_type,
        )
    finally:
        conn.close()


@app.route("/record/<int:memo_id>")
@require_admin
def record_detail(memo_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT m.*, u.username FROM yunfu.memo m "
                "LEFT JOIN yunfu.user u ON m.user_id = u.user_id WHERE m.memo_id = %s",
                (memo_id,),
            )
            memo = cur.fetchone()
        if not memo:
            abort(404)
        memo["created_at"] = str(memo["created_at"]) if memo.get("created_at") else ""
        t = memo["type"]
        detail = None
        if t == "text":
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT text_id, memo_id, title, content, created_at FROM yunfu.text WHERE memo_id = %s LIMIT 1",
                    (memo_id,),
                )
                detail = cur.fetchone()
            if detail:
                detail["created_at"] = str(detail["created_at"]) if detail.get("created_at") else ""
        elif t == "voice":
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT voice_id, memo_id, title, url, text_content, created_at FROM yunfu.voice WHERE memo_id = %s LIMIT 1",
                    (memo_id,),
                )
                detail = cur.fetchone()
            if detail:
                detail["created_at"] = str(detail["created_at"]) if detail.get("created_at") else ""
        elif t == "photo":
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT photo_id, memo_id, url, created_at FROM yunfu.photo WHERE memo_id = %s ORDER BY photo_id",
                    (memo_id,),
                )
                detail = {"photos": cur.fetchall()}
            for p in detail["photos"]:
                p["created_at"] = str(p["created_at"]) if p.get("created_at") else ""
        elif t == "file":
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT file_id, memo_id, title, url, created_at FROM yunfu.file WHERE memo_id = %s LIMIT 1",
                    (memo_id,),
                )
                detail = cur.fetchone()
            if detail:
                detail["created_at"] = str(detail["created_at"]) if detail.get("created_at") else ""
        return render_template(
            "record_detail.html",
            memo=memo,
            detail=detail,
            memo_type=t,
        )
    finally:
        conn.close()


@app.route("/conversations")
@require_admin
def conversations():
    user_id = request.args.get("user_id", type=int)
    conn = get_db()
    try:
        with conn.cursor() as cur:
            sql = (
                "SELECT c.conversation_id, c.user_id, c.title, c.created_at, c.updated_at, u.username "
                "FROM yunfu.conversation c "
                "LEFT JOIN yunfu.user u ON c.user_id = u.user_id WHERE 1=1"
            )
            params = []
            if user_id:
                sql += " AND c.user_id = %s"
                params.append(user_id)
            sql += " ORDER BY c.updated_at DESC LIMIT 300"
            cur.execute(sql, params or None)
            rows = cur.fetchall()
        for r in rows:
            r["created_at"] = str(r["created_at"]) if r.get("created_at") else ""
            r["updated_at"] = str(r["updated_at"]) if r.get("updated_at") else ""
        return render_template(
            "conversations.html",
            conversations=rows,
            user_id=user_id,
        )
    finally:
        conn.close()


def message_content_to_html(content):
    """将 message.content（Markdown，含 ![alt](url)）转为 HTML，图片可显示。"""
    if not content:
        return ""
    html = markdown.markdown(
        content,
        extensions=["extra", "nl2br"],
        output_format="html",
    )
    return html


@app.route("/conversation/<int:conversation_id>")
@require_admin
def conversation_detail(conversation_id):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT c.*, u.username FROM yunfu.conversation c "
                "LEFT JOIN yunfu.user u ON c.user_id = u.user_id WHERE c.conversation_id = %s",
                (conversation_id,),
            )
            conv = cur.fetchone()
        if not conv:
            abort(404)
        conv["created_at"] = str(conv["created_at"]) if conv.get("created_at") else ""
        conv["updated_at"] = str(conv["updated_at"]) if conv.get("updated_at") else ""
        with conn.cursor() as cur:
            cur.execute(
                "SELECT message_id, conversation_id, user_id, content, is_ai, created_at "
                "FROM yunfu.message WHERE conversation_id = %s ORDER BY created_at ASC",
                (conversation_id,),
            )
            messages = cur.fetchall()
        for m in messages:
            m["created_at"] = str(m["created_at"]) if m.get("created_at") else ""
            m["content_html"] = message_content_to_html(m.get("content") or "")
        return render_template(
            "conversation_detail.html",
            conversation=conv,
            messages=messages,
        )
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
