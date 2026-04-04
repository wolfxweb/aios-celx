<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Início — {{ config('app.name') }}</title>
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
        body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }
        a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .wrap { max-width: 880px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }
        h1 { font-size: 1.75rem; margin: 0; letter-spacing: -0.02em; }
        .lead { font-size: 1.05rem; color: var(--text-secondary); margin: 0 0 2rem; }
        .btn {
            display: inline-block;
            padding: 0.55rem 1.1rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            border: 1px solid transparent;
        }
        .btn-primary { background: var(--color-primary); color: #fff; }
        .btn-primary:hover { background: var(--color-primary-dark); text-decoration: none; }
        .btn-ghost { background: var(--surface); border-color: var(--border); color: var(--text); }
        section { margin-bottom: 2.25rem; }
        section h2 {
            font-size: 1.1rem;
            margin: 0 0 0.75rem;
            color: var(--color-primary-dark);
        }
        .section-example h2 { color: var(--text-secondary); font-weight: 600; }
        ul.features {
            margin: 0;
            padding-left: 1.25rem;
        }
        ul.features li { margin-bottom: 0.5rem; }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1.25rem 1.35rem;
        }
        .meta {
            font-size: 0.88rem;
            color: var(--text-secondary);
            border-left: 3px solid var(--color-primary);
            padding-left: 1rem;
            margin: 0;
        }
        footer {
            margin-top: 2.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
<div class="wrap">
    <header>
        <strong style="font-size:1.1rem;">{{ config('app.name') }}</strong>
        <div>
            <a href="{{ route('login') }}" class="btn btn-primary">Entrar</a>
        </div>
    </header>

    <h1>Framework aios-celx</h1>
    <p class="lead">
        <strong>Produtos desenvolvidos com arquitetura orientada por agentes, automação governada,
        workflows estruturados e execução AI-First</strong> para transformar ideias em software escalável.
    </p>

    <section>
        <h2>O ecossistema (foco)</h2>
        <p class="meta" style="margin-bottom: 1rem;">
            O <strong>aios-celx</strong> é um <strong>framework em Node.js + TypeScript</strong> para orquestrar
            o desenvolvimento com <strong>agentes</strong>, <strong>workflows em YAML</strong>,
            <strong>backlog estruturado</strong> e <strong>automação governada</strong> (fila, scheduler, autonomia).
        </p>
        <p class="meta" style="border-left-color: var(--text-secondary); margin: 0;">
            Este repositório é o <strong>monorepo</strong> do CLI (<code>aios</code>), pacotes internos,
            API HTTP opcional e dashboard opcional. O estado e a documentação do produto gerido vivem em
            <code>projects/&lt;id&gt;/</code> (docs, backlog, <code>.aios/</code>), não na app web abaixo.
        </p>
    </section>

    <section class="section-example">
        <h2>Aplicação de exemplo nesta pasta (Assistência Tickets)</h2>
        <p class="lead" style="margin-bottom: 1rem;">
            A página que está a ler faz parte de um <strong>exemplo runnable</strong> — gestão de chamados com SLA e portal do cliente —
            para demonstrar um produto entregue com o workflow acima. Não substitui o foco no framework.
        </p>
        <div class="card">
            <ul class="features">
                <li><strong>Tickets</strong> — abertura, prioridades, estados, atribuição a técnicos e histórico de interações.</li>
                <li><strong>SLA</strong> — prazos de primeira resposta e resolução por prioridade, com pausas em estados configuráveis.</li>
                <li><strong>Cadastros</strong> — clientes, contactos e equipamentos por cliente; selecção contextual nos tickets.</li>
                <li><strong>Horas e anexos</strong> — registo de tempo por ticket e ficheiros em armazenamento local.</li>
                <li><strong>Perfis</strong> — administrador, atendente, técnico, supervisor e <strong>cliente (portal)</strong>, com políticas de visibilidade.</li>
                <li><strong>Portal do cliente</strong> — consulta dos pedidos da empresa e mensagens públicas com a equipa.</li>
                <li><strong>Relatórios e API</strong> — indicadores no backoffice e API REST (Sanctum) para integrações.</li>
            </ul>
        </div>
    </section>

    <p>
        <a href="{{ route('login') }}" class="btn btn-primary">Aceder à aplicação de exemplo</a>
    </p>

    <footer>
        <strong>Framework</strong> — monorepo aios-celx (raiz do repositório). <strong>Exemplo</strong> — Laravel em
        <code>projects/assistencia-tickets/web</code>.
    </footer>
</div>
</body>
</html>
