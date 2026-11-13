<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
        'paytech' => [
        'key'       => env('PAYTECH_API_KEY'),
        'secret'    => env('PAYTECH_API_SECRET'),
        'env'       => env('PAYTECH_ENV', 'test'),
        'ipn_url'   => env('PAYTECH_IPN_URL'),
        'front_url' => env('FRONTEND_URL', 'http://localhost:4200'),
    ],
        'change' => [
        // Valeur de secours si le service de taux est indisponible (à ajuster)
        'usd_par_eur' => env('USD_PAR_EUR', 1.10),
    ],
    'retrait' => [
        'minimum' => env('RETRAIT_MINIMUM', 5000),
    ],

];
