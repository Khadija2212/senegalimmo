<?php

namespace App\Http\Controllers;

use App\Enums\TypeMedia;
use App\Models\Bien;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Téléverser fichiers » et « Téléverser des photos » («use» ServiceStockage). */
class MediaController extends Controller
{
    private const TAILLE_MAX_KO = 20480;

    private const TYPES_FICHIER = [
        'photo' => 'mimes:jpg,jpeg,png,webp',
        'video' => 'mimes:mp4,mov,webm',
        'plan' => 'mimes:pdf,jpg,jpeg,png',
        'document' => 'mimes:pdf',
    ];

    public function store(Request $request, Bien $bien): JsonResponse
    {
        $this->exigerGestion($bien, $request->user());
        $type = $request->validate(['type' => ['required', Rule::enum(TypeMedia::class)]])['type'];
        $request->validate(['fichier' => ['required', 'file', self::TYPES_FICHIER[$type], 'max:'.self::TAILLE_MAX_KO]]);
        $fichier = $request->file('fichier');

        $media = Media::depuisFichier((string) $fichier->get(), 'medias/'.$bien->id.'/'.$fichier->hashName(), TypeMedia::from($type));
        $bien->ajouterMedia($media);

        return response()->json($media, Response::HTTP_CREATED);
    }

    public function destroy(Request $request, Media $media): JsonResponse
    {
        $this->exigerGestion($media->bien, $request->user());
        $media->supprimer();

        return response()->json(['message' => 'Média supprimé.']);
    }
}
