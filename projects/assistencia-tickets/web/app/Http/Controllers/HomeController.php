<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(): View|RedirectResponse
    {
        if (auth()->check()) {
            return auth()->user()->role === User::ROLE_CLIENT
                ? redirect()->route('portal.tickets.index')
                : redirect()->route('dashboard');
        }

        return view('home');
    }
}
