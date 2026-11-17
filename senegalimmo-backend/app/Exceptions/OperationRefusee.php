<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/** Une règle métier interdit cette opération. Rendue en JSON avec son code HTTP. */
class OperationRefusee extends RuntimeException
{
    public const INTERDIT = 403;

    public const INVALIDE = 422;

    public const NON_AUTHENTIFIE = 401;

    public const INTROUVABLE = 404;

    public function __construct(string $message, private readonly int $statut = self::INVALIDE)
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], $this->statut);
    }
}
