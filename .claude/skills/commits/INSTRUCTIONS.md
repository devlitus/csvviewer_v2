# Instrucciones Técnicas para el Skill de Commits

Este documento detalla cómo el skill `commits` invoca al agente `implementer` para crear commits interactivos.

## Arquitectura

El skill de commits funciona en contexto fork con el agente implementer. Esto significa:

1. **Contexto independiente**: El skill corre en una subagente fork, aislado de la conversación principal
2. **Agente dedicado**: Usa el agente `implementer` que está diseñado para escribir y modificar código
3. **Herramientas restringidas**: Solo permite Bash, Read y Grep para máxima seguridad

## Flujo de ejecución

### 1. Recolección de información (Claude Code)

Claude Code recibe respuestas a preguntas interactivas:
- Tipo de commit (feat, fix, refactor, etc)
- Scope del cambio (upload, files, visualizer, etc)
- Descripción concisa del cambio
- Cuerpo detallado (opcional)

### 2. Delegación al agente implementer (contexto fork)

Una vez recolectada la información, el skill invoca el agente implementer con instrucciones:

```markdown
Ejecuta los siguientes pasos para crear un commit con Conventional Commits:

**Datos del commit:**
- Tipo: {tipo}
- Scope: {scope}
- Descripción: {descripción}
- Cuerpo: {cuerpo}

**Pasos a ejecutar:**

1. Validar cambios pendientes:
   - Ejecuta: git status
   - Verifica que hay cambios sin commitear
   - Si no hay cambios, aborta y reporta

2. Mostrar cambios:
   - Ejecuta: git diff --staged
   - Muestra qué se va a commitear

3. Mostrar resumen del commit:
   - Tipo: {tipo}
   - Scope: ({scope})
   - Descripción: {descripción}
   - Si hay cuerpo, muéstralo

4. Crear el commit:
   - Formatea el mensaje según Conventional Commits:
     {tipo}({scope}): {descripción}

     {cuerpo}

     Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

   - Ejecuta: git commit -m "{mensaje_multilinea}"
   - Si falla, reporta el error

5. Verificar éxito:
   - Ejecuta: git status
   - Reporta que el commit se creó exitosamente
```

### 3. Ejecución de comandos bash

El agente implementer ejecuta:

```bash
# Validación
git status

# Visualización de cambios
git diff --staged

# Creación del commit
git commit -m "tipo(scope): descripción

Cuerpo detallado si aplica

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# Verificación final
git status
```

## Manejo de errores

El agente implementer debe manejar:

### Error: Sin cambios pendientes
```
Situación: git status muestra "nothing to commit, working tree clean"
Acción: Abortar y reportar que no hay cambios para commitear
```

### Error: Commit fallido
```
Situación: git commit retorna código de error
Acción: Mostrar el error exacto del comando git y abortar
Causa probable: Configuración de git incompleta, permisos
```

### Error: Mensaje de commit inválido
```
Situación: El mensaje contiene caracteres problemáticos
Acción: Escapar caracteres especiales y reintentar
```

## Variables de entorno esperadas

El skill assume:
- `GIT_AUTHOR_NAME` y `GIT_AUTHOR_EMAIL` configurados (o git config global)
- Directorio de trabajo es el repositorio Git
- No se requieren credenciales adicionales para commit local

## Respuesta esperada

Después de ejecución, el agente implementer reporta:

```
Commit creado exitosamente:

Tipo: feat
Scope: visualizer
Descripción: agregar exportación a Excel

Mensaje completo:
feat(visualizer): agregar exportación a Excel

Permite usuarios exportar datos CSV a formato XLSX usando la librería xlsx.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

Estado actual:
On branch main
nothing to commit, working tree clean
```

## Integración con Claude Code

El skill es `user-invocable: true`, lo que significa:

1. Aparece en el menú de slash commands: `/commits`
2. Claude puede invocarlo automáticamente si lo cree relevante
3. Corre en contexto fork para aislamiento
4. Los cambios creados por el agente implementer son visibles en el repositorio después de ejecutarse

## Consideraciones de seguridad

- **allowed-tools restringidas**: Solo Bash (para git), Read (para verificar), Grep (si aplica)
- **Sin acceso a Edit/Write**: El agente implementer solo ejecuta comandos git, no modifica archivos
- **Confirmación visual**: Se muestra resumen antes de crear el commit
- **Co-authored-by automático**: Siempre incluye la línea de atribución a Claude

## Notas de desarrollo

Si necesitas actualizar el skill:

1. Edita `SKILL.md` para cambiar instrucciones o descripción
2. Actualiza `INSTRUCTIONS.md` (este archivo) si cambia la arquitectura
3. Prueba con `/commits` en Claude Code
4. Verifica que los commits se crean correctamente con `git log`

El skill está optimizado para:
- Commits atómicos (un cambio por commit)
- Historial limpio y rastreable
- Conformidad con Conventional Commits
- Uso desde Claude Code sin terminal manual
