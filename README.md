# ✅ Todo App

Aplicación de gestión de tareas construida con React + Vite, Supabase y Tailwind CSS.

## Stack

| Tecnología | Uso |
|---|---|
| React + Vite | Frontend |
| Supabase | Base de datos (PostgreSQL) |
| Tailwind CSS | Estilos |
| @dnd-kit | Drag & drop |
| date-fns | Manejo de fechas |
| Netlify | Deploy |

## Funcionalidades

- ✅ Crear, editar inline (doble click), eliminar tareas
- 🏷️ Categorías con color personalizado
- 📅 Fechas de vencimiento con indicador visual (gris / verde / rojo)
- 🔃 Drag & drop para reordenar (persiste en Supabase)
- 🔍 Filtro por categoría

## Configuración local

### 1. Clonar e instalar

```bash
git clone https://github.com/tuusuario/todo-app.git
cd todo-app
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completá `.env` con los valores de tu proyecto Supabase:  
**Dashboard → Settings → API**

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

### 3. Base de datos

Ejecutá el script SQL en **Supabase → SQL Editor**:

```sql
create extension if not exists "uuid-ossp";

create table categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table todos (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  completed   boolean not null default false,
  due_date    date,
  category_id uuid references categories (id) on delete set null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;
alter table todos      enable row level security;

create policy "public access categories" on categories for all using (true) with check (true);
create policy "public access todos"      on todos      for all using (true) with check (true);
```

### 4. Correr en local

```bash
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173)

## Deploy en Netlify

1. Subí el repo a GitHub
2. En Netlify: **Add new site → Import an existing project**
3. Netlify detecta `netlify.toml` automáticamente
4. Agregá las variables de entorno en **Site configuration → Environment variables**
5. Deploy 🚀

## Estructura del proyecto

```
src/
├── lib/
│   └── supabase.js          # Cliente de Supabase
├── hooks/
│   ├── useTodos.js          # CRUD + reorder de tareas
│   └── useCategories.js     # CRUD de categorías
├── components/
│   ├── TodoItem.jsx          # Item con drag, edición inline y badges
│   ├── AddTodoForm.jsx       # Formulario de nueva tarea
│   ├── CategoryFilter.jsx    # Pills de filtro por categoría
│   └── CategoryModal.jsx     # Modal para gestionar categorías
└── App.jsx                   # Componente raíz
```
