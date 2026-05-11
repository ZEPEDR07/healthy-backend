#!/usr/bin/env python3
"""
Corrige erro de sintaxe no server.py - aspas mal escapadas no system prompt de nutrition
"""

with open("/app/backend/server.py", "r") as f:
    content = f.read()

bad = '''        _system = (
            "És um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
            "Responde APENAS em JSON puro com a estrutura: "
            "{"items":[{"name":"<nome>","calories":<int>,"protein_g":<int>,"
            ""carbs_g":<int>,"fat_g":<int>}],"
            ""totals":{"calories":<int>,"protein_g":<int>,"carbs_g":<int>,"fat_g":<int>},"
            ""summary":"<frase curta>"}. "
            "Estima porções a olho. Se não identificares comida, devolve items vazio e summary "
            "'Não foi detectada comida'."
        )'''

good = '''        _system = (
            "Es um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
            "Responde APENAS em JSON puro com a estrutura: "
            '{\"items\":[{\"name\":\"<nome>\",\"calories\":<int>,\"protein_g\":<int>,'
            '\"carbs_g\":<int>,\"fat_g\":<int>}],'
            '\"totals\":{\"calories\":<int>,\"protein_g\":<int>,\"carbs_g\":<int>,\"fat_g\":<int>},'
            '\"summary\":\"<frase curta>\"}. '
            "Estima porcoes a olho. Se nao identificares comida, devolve items vazio e summary "
            "'Nao foi detectada comida'."
        )'''

if bad in content:
    content = content.replace(bad, good)
    print("✅ Erro de sintaxe corrigido")
else:
    print("⚠️  Texto não encontrado - tentando correção alternativa...")
    # Fallback: reescreve a secção problemática linha a linha
    import re
    pattern = r'_system = \(.*?\'Não foi detectada comida\'\.\s*\)'
    replacement = '''_system = (
            "Es um nutricionista IA que analisa fotos de comida e devolve macros em pt-PT. "
            "Responde APENAS em JSON puro com a estrutura: "
            \'{\"items\":[{\"name\":\"<nome>\",\"calories\":<int>,\"protein_g\":<int>,\'
            \'\"carbs_g\":<int>,\"fat_g\":<int>}],\'
            \'\"totals\":{\"calories\":<int>,\"protein_g\":<int>,\"carbs_g\":<int>,\"fat_g\":<int>},\'
            \'\"summary\":\"<frase curta>\"}. \'
            "Estima porcoes a olho. Se nao identificares comida, devolve items vazio e summary "
            "\'Nao foi detectada comida\'."
        )'''
    content_new = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if content_new != content:
        content = content_new
        print("✅ Correção alternativa aplicada")
    else:
        print("❌ Não foi possível corrigir automaticamente")

with open("/app/backend/server.py", "w") as f:
    f.write(content)

# Verifica sintaxe
import subprocess
result = subprocess.run(["python3", "-m", "py_compile", "/app/backend/server.py"], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Sintaxe Python válida!")
else:
    print(f"❌ Ainda há erros de sintaxe:\n{result.stderr}")
