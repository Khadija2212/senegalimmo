<?php

namespace App\Enums;

/** Énumération CanalNotification du diagramme de classes. */
enum CanalNotification: string
{
    use ValeursEnum;

    case PUSH = 'push';
    case SMS = 'sms';
    case EMAIL = 'email';
}
