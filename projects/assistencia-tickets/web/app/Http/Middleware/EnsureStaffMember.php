<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffMember
{
    /**
     * Utilizadores com perfil "client" só acedem à área portal; rotas internas redireccionam.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->role === User::ROLE_CLIENT) {
            return redirect()->route('portal.tickets.index');
        }

        return $next($request);
    }
}
