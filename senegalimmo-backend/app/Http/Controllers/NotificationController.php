<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Les notifications reçues par le compte connecté (association « reçoit »). */
class NotificationController extends Controller
{
    private const PAR_PAGE = 30;

    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();

        return response()->json([
            'non_lues' => $compte->notifications()->whereNull('lue_le')->count(),
            'notifications' => $compte->notifications()->paginate(self::PAR_PAGE),
        ]);
    }

    public function marquerLue(Request $request, Notification $notification): JsonResponse
    {
        $this->exigerQue($notification->compte_id === $request->user()->id);
        $notification->marquerLue();

        return response()->json($notification);
    }

    public function toutLire(Request $request): JsonResponse
    {
        $request->user()->notifications()->whereNull('lue_le')->update(['lue_le' => now()]);

        return response()->json(['message' => 'Toutes les notifications sont lues.']);
    }
}
