<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Portal') — {{ config('app.name') }}</title>
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
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; }
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
        main { flex: 1; padding: 1.5rem; max-width: 960px; margin: 0 auto; width: 100%; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
        .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid transparent; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
        .btn-primary { background: var(--color-primary); color: #fff; }
        .btn-ghost { background: transparent; border-color: var(--border); color: var(--text); }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
        th { color: var(--text-secondary); font-weight: 600; }
        .flash { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; background: var(--color-primary-soft); color: var(--color-primary-dark); }
        label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem; }
        textarea { width: 100%; max-width: 40rem; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; font: inherit; min-height: 6rem; }
        .field { margin-bottom: 1rem; }
    </style>
    @stack('head')
</head>
<body>
<div class="shell">
    <header class="app-header">
        <strong>{{ config('app.name') }} — Portal</strong>
        <nav>
            <a href="{{ route('portal.tickets.index') }}">Os meus pedidos</a>
            <form method="post" action="{{ route('logout') }}" style="display:inline;margin:0;">
                @csrf
                <button type="submit" class="btn btn-ghost">Sair</button>
            </form>
        </nav>
    </header>
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
