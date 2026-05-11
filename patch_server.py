#!/usr/bin/env python3
"""
Patch server.py: substitui emergentintegrations por anthropic SDK oficial
"""
import re

with open("/app/backend/server.py", "r") as f:
    content = f.read()

# ── PATCH 1: Tips function ──────────────────────────────────────────────────
old_tips = '''        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"tips-{user['id']}-{focus}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"{context}\\n\\nGera uma dica premium em JSON.")
        response = await chat.send_message(msg)'''

new_tips = '''        import anthropic as _anthropic
        _client = _anthropic.AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
        _resp = await _client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=system_msg,
            messages=[{"role": "user", "content": f"{context}\\n\\nGera uma dica premium em JSON."}],
        )
        response = _resp.content[0].text'''

# ── PATCH 2: Nutrition function ─────────────────────────────────────────────
old_nutrition = '''        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"nutrition-{user['id']}-{uuid.uuid4()}",
            system_message=(
                "És um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
                "Responde APENAS em JSON puro com a estrutura: "
                "{\\\"items\\\":[{\\\"name\\\":\\\"<nome>\\\",\\\"calories\\\":<int>,\\\"protein_g\\\":<int>,"
                "\\\"carbs_g\\\":<int>,\\\"fat_g\\\":<int>}],"
                "\\\"totals\\\":{\\\"calories\\\":<int>,\\\"protein_g\\\":<int>,\\\"carbs_g\\\":<int>,\\\"fat_g\\\":<int>},"
                "\\\"summary\\\":\\\"<frase curta>\\\"}. "
                "Estima porções a olho. Se não identificares comida, devolve items vazio e summary "
                "'Não foi detectada comida'."
            ),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        image_content = ImageContent(image_base64=b64)
        prompt = "Analisa esta refeição e devolve macros estimados em JSON."
        if req.note:
            prompt += f" Nota do utilizador: {req.note}"
        msg = UserMessage(text=prompt, file_contents=[image_content])
        response = await chat.send_message(msg)'''

new_nutrition = '''        import anthropic as _anthropic
        _client = _anthropic.AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
        _system = (
            "És um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
            "Responde APENAS em JSON puro com a estrutura: "
            "{\"items\":[{\"name\":\"<nome>\",\"calories\":<int>,\"protein_g\":<int>,"
            "\"carbs_g\":<int>,\"fat_g\":<int>}],"
            "\"totals\":{\"calories\":<int>,\"protein_g\":<int>,\"carbs_g\":<int>,\"fat_g\":<int>},"
            "\"summary\":\"<frase curta>\"}. "
            "Estima porções a olho. Se não identificares comida, devolve items vazio e summary "
            "'Não foi detectada comida'."
        )
        _prompt = "Analisa esta refeição e devolve macros estimados em JSON."
        if req.note:
            _prompt += f" Nota do utilizador: {req.note}"
        _resp = await _client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            system=_system,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": _prompt},
                ],
            }],
        )
        response = _resp.content[0].text'''

if old_tips in content:
    content = content.replace(old_tips, new_tips)
    print("✅ PATCH 1 (tips) aplicado")
else:
    print("⚠️  PATCH 1 (tips) - texto não encontrado, tenta patch manual")

if old_nutrition in content:
    content = content.replace(old_nutrition, new_nutrition)
    print("✅ PATCH 2 (nutrition) aplicado")
else:
    print("⚠️  PATCH 2 (nutrition) - texto não encontrado, tenta patch manual")

with open("/app/backend/server.py", "w") as f:
    f.write(content)

print("✅ server.py guardado")
