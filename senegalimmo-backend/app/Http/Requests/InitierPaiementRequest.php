<?php

namespace App\Http\Requests;

use App\Enums\MethodePaiement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Corps du cas « Effectuer un paiement » : la sous-classe de Paiement, la méthode et le contrat réglé. */
class InitierPaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['loyer', 'caution', 'indemnite'])],
            'methode' => ['required', Rule::enum(MethodePaiement::class)],
            'bail_id' => ['required_if:type,loyer,caution', 'nullable', 'uuid', Rule::exists('contrats', 'id')->where('nature', 'bail')],
            'promesse_id' => ['required_if:type,indemnite', 'nullable', 'uuid', Rule::exists('contrats', 'id')->where('nature', 'promesse_vente')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'bail_id.required_if' => 'Le bail est requis pour ce paiement.',
            'promesse_id.required_if' => 'La promesse de vente est requise pour ce paiement.',
        ];
    }

    public function methode(): MethodePaiement
    {
        return MethodePaiement::from((string) $this->validated('methode'));
    }
}
