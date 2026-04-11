import os
import re

TARGET_DIR = r"f:\k224402\PROJECTS\FYP\FYP-Application\Backend"

def get_relative_prisma_import(file_path):
    rel_path = os.path.relpath(file_path, TARGET_DIR).replace("\\", "/")
    target_dir = "src/config/prisma"
    file_dir = os.path.dirname(rel_path)
    if not file_dir:
        return "./" + target_dir
    
    file_dir_parts = [p for p in file_dir.split("/") if p]
    target_dir_parts = target_dir.split("/")
    
    i = 0
    while i < len(file_dir_parts) and i < len(target_dir_parts) and file_dir_parts[i] == target_dir_parts[i]:
        i += 1
        
    ups = len(file_dir_parts) - i
    downs = target_dir_parts[i:]
    
    res = ("../" * ups) + "/".join(downs)
    if not res.startswith("."):
        res = "./" + res
    return res

for root, dirs, files in os.walk(TARGET_DIR):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if "dist" in dirs:
        dirs.remove("dist")
    
    for file in files:
        if file.endswith(".ts") and file != "prisma.ts":
            file_path = os.path.join(root, file)
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            original_content = content
            
            # Remove const prisma = new PrismaClient() taking the whole line
            content = re.sub(r"^[ \t]*const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\)\s*;?[ \t]*\n?", "", content, flags=re.MULTILINE)
            
            def import_replacer(match):
                import_clause = match.group(1)
                import_path = match.group(2)
                
                items = [x.strip() for x in import_clause.split(",")]
                items = [x for x in items if x]
                
                if "PrismaClient" in items:
                    items.remove("PrismaClient")
                    rel_import = get_relative_prisma_import(file_path)
                    new_import = f"import prisma from '{rel_import}';\n"
                    
                    if items:
                        joined = ", ".join(items)
                        new_import += f"import {{ {joined} }} from '{import_path}';"
                    return new_import
                else:
                    return match.group(0)
                
            content = re.sub(r"import\s+\{\s*([^}]+)\s*\}\s+from\s+[\"']([^\"']+)[\"']\s*;?", import_replacer, content)
            
            if content != original_content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Refactored: {file_path}")
