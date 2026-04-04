<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Prazos de primeira resposta (horas úteis simplificadas: horas civis)
    |--------------------------------------------------------------------------
    */
    'response_hours' => [
        'low' => 72,
        'normal' => 24,
        'high' => 8,
        'critical' => 4,
    ],

    /*
    |--------------------------------------------------------------------------
    | Prazo de resolução (SLA de solução)
    |--------------------------------------------------------------------------
    */
    'resolution_hours' => [
        'low' => 240,
        'normal' => 120,
        'high' => 48,
        'critical' => 24,
    ],

    /*
    |--------------------------------------------------------------------------
    | Estados em que o relógio de SLA de resolução fica em pausa (MVP)
    |--------------------------------------------------------------------------
    */
    'pause_resolution_statuses' => [
        'waiting_customer',
        'waiting_part',
    ],
];
