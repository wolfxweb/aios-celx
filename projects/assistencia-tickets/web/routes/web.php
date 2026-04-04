<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TicketAttachmentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    Route::middleware('role:client')->prefix('portal')->name('portal.')->group(function () {
        Route::get('tickets', [PortalController::class, 'index'])->name('tickets.index');
        Route::get('tickets/{ticket}', [PortalController::class, 'show'])->name('tickets.show');
        Route::post('tickets/{ticket}/comments', [PortalController::class, 'storeComment'])->name('tickets.comments.store');
    });

    Route::middleware('staff')->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::get('reports', ReportsController::class)->name('reports.index');

        Route::middleware('role:admin')->group(function () {
            Route::get('settings', SettingsController::class)->name('settings.index');
            Route::resource('users', UserController::class)->except(['show']);
        });

        Route::resource('clients', ClientController::class);
        Route::resource('clients.contacts', ContactController::class)->except(['show'])->scoped();
        Route::resource('clients.equipments', EquipmentController::class)->except(['show'])->scoped();

        Route::post('tickets/{ticket}/interactions', [TicketController::class, 'storeInteraction'])
            ->name('tickets.interactions.store');
        Route::post('tickets/{ticket}/time-entries', [TimeEntryController::class, 'store'])
            ->name('tickets.time-entries.store');
        Route::delete('tickets/{ticket}/time-entries/{timeEntry}', [TimeEntryController::class, 'destroy'])
            ->name('tickets.time-entries.destroy');
        Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store'])
            ->name('tickets.attachments.store');
        Route::delete('tickets/{ticket}/attachments/{attachment}', [TicketAttachmentController::class, 'destroy'])
            ->name('tickets.attachments.destroy');

        Route::resource('tickets', TicketController::class);
    });
});
