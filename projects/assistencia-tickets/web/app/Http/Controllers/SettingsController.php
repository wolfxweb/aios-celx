<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class SettingsController extends Controller
{
    public function __invoke(): View
    {
        return view('settings.index', [
            'responseHours' => config('sla.response_hours'),
            'resolutionHours' => config('sla.resolution_hours'),
            'pauseStatuses' => config('sla.pause_resolution_statuses'),
        ]);
    }
}
