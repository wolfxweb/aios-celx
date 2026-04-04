<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Assistência Tickets') — {{ config('app.name') }}</title>
    <style>
        :root {
            --color-primary: #2563EB;
            --color-primary-dark: #1E3A8A;
            --color-primary-soft: #DBEAFE;
            --bg: #F8FAFC;
            --surface: #FFFFFF;
            --border: #E2E8F0;
            --text: #0F172A;
            --text-secondary: #475569;
            --text-muted: #94A3B8;
            --status-new: #3B82F6;
            --status-in-progress: #F59E0B;
            --status-waiting-customer: #8B5CF6;
            --status-waiting-part: #EAB308;
            --status-resolved: #22C55E;
            --status-closed: #15803D;
            --status-cancelled: #64748B;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.5;
        }
        a { color: var(--color-primary); text-decoration: none; }
        a:hover { text-decoration: underline; }
        .shell { min-height: 100vh; display: flex; flex-direction: column; }
        header.app-header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 0.75rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
        }
        header.app-header nav { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        header.app-header a { font-weight: 500; color: var(--text-secondary); text-decoration: none; }
        header.app-header a:hover { color: var(--color-primary); }
        main { flex: 1; padding: 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.25rem;
            margin-bottom: 1rem;
        }
        .btn {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid transparent;
            font-weight: 600;
            cursor: pointer;
            font-size: 0.875rem;
        }
        .btn-primary { background: var(--color-primary); color: #fff; }
        .btn-primary:hover { background: var(--color-primary-dark); }
        .btn-ghost { background: transparent; border-color: var(--border); color: var(--text); }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
        th { color: var(--text-secondary); font-weight: 600; }
        .badge {
            display: inline-block;
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
        }
        .flash { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; background: var(--color-primary-soft); color: var(--color-primary-dark); }
        label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem; }
        input, select, textarea {
            width: 100%; max-width: 32rem; padding: 0.5rem 0.75rem; border: 1px solid var(--border);
            border-radius: 6px; font: inherit;
        }
        .field { margin-bottom: 1rem; }
        .error { color: #B91C1C; font-size: 0.8rem; margin-top: 0.25rem; }
        [x-cloak] { display: none !important; }
    </style>
    @stack('head')
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
</head>
<body>
<div class="shell">
    @auth
        <header class="app-header">
            <strong>{{ config('app.name') }}</strong>
            <nav>
                <a href="{{ route('dashboard') }}">Dashboard</a>
                <a href="{{ route('tickets.index') }}">Tickets</a>
                <a href="{{ route('clients.index') }}">Clientes</a>
                <a href="{{ route('reports.index') }}">Relatórios</a>
                @if(auth()->user()->isAdmin())
                    <a href="{{ route('users.index') }}">Utilizadores</a>
                    <a href="{{ route('settings.index') }}">SLA / Config</a>
                @endif
                <form method="post" action="{{ route('logout') }}" style="display:inline;margin:0;">
                    @csrf
                    <button type="submit" class="btn btn-ghost">Sair</button>
                </form>
            </nav>
        </header>
    @else
        <header class="app-header">
            <strong>{{ config('app.name') }}</strong>
        </header>
    @endauth
    <main>
        @if (session('status'))
            <div class="flash" role="status">{{ session('status') }}</div>
        @endif
        @yield('content')
    </main>
</div>
@stack('scripts')
</body>
</html>
