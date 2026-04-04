@extends('layouts.app')

@section('title', 'Entrar')

@section('content')
    <div class="card" style="max-width: 420px; margin: 2rem auto;">
        <h1 style="margin-top: 0;">Entrar</h1>
        @unless(app()->environment('production'))
            <div style="font-size:0.8rem;background:var(--color-primary-soft, #DBEAFE);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.25rem;color:var(--color-primary-dark, #1E3A8A);">
                <strong style="display:block;margin-bottom:0.5rem;">Contas de demonstração</strong>
                <span style="color:var(--text-secondary);">Palavra-passe em todas: <code style="background:#fff;padding:0.1rem 0.35rem;border-radius:4px;">password</code></span>
                <ul style="margin:0.5rem 0 0;padding-left:1.1rem;line-height:1.5;">
                    <li><strong>Admin</strong> — <code>admin@example.com</code></li>
                    <li><strong>Técnico</strong> — <code>tech@example.com</code></li>
                    <li><strong>Cliente (portal)</strong> — <code>cliente@example.com</code></li>
                </ul>
                <p style="margin:0.5rem 0 0;font-size:0.75rem;opacity:0.9;">Criadas por <code>php artisan migrate --seed</code>. Oculto em <code>APP_ENV=production</code>.</p>
            </div>
        @endunless
        <form method="post" action="{{ route('login') }}">
            @csrf
            <div class="field">
                <label for="email">E-mail</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
                @error('email')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label for="password">Palavra-passe</label>
                <input id="password" type="password" name="password" required autocomplete="current-password">
                @error('password')<div class="error">{{ $message }}</div>@enderror
            </div>
            <div class="field">
                <label><input type="checkbox" name="remember" value="1" @checked(old('remember'))> Manter sessão</label>
            </div>
            <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
        <p style="margin-top:1rem;font-size:0.875rem;">
            <a href="{{ route('home') }}">← Voltar ao início</a>
        </p>
    </div>
@endsection
