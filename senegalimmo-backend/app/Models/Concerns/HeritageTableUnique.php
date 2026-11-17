<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Héritage à table unique d'une classe abstraite du diagramme (Compte, Paiement, Contrat).
 * Une colonne discriminante désigne la sous-classe ; chaque sous-classe ne voit que ses lignes,
 * et tous() charge chaque ligne dans sa propre sous-classe.
 *
 * @mixin Model
 */
trait HeritageTableUnique
{
    /** Nom de la colonne discriminante. */
    abstract protected static function colonneDiscriminante(): string;

    /** @return array<string, class-string<Model>> valeur de la colonne vers sous-classe concrète */
    abstract public static function sousClasses(): array;

    protected static function bootHeritageTableUnique(): void
    {
        $valeur = static::valeurDiscriminante();
        if ($valeur === null) {
            return;
        }
        $colonne = static::colonneDiscriminante();
        static::addGlobalScope('heritage', fn (Builder $q) => $q->where($q->getModel()->getTable().'.'.$colonne, $valeur));
        static::creating(function (Model $m) use ($colonne, $valeur): void {
            $m->setAttribute($colonne, $valeur);
        });
    }

    /** Valeur de la colonne discriminante pour cette classe, null pour la classe abstraite. */
    public static function valeurDiscriminante(): ?string
    {
        $valeur = array_search(static::class, static::sousClasses(), true);

        return $valeur === false ? null : $valeur;
    }

    /** Toutes les lignes, chacune chargée dans sa sous-classe concrète. */
    public static function tous(): Builder
    {
        $classes = static::sousClasses();

        return (new (reset($classes))())->newQueryWithoutScope('heritage');
    }

    /** @param object|array<string, mixed> $attributes */
    public function newFromBuilder($attributes = [], $connection = null): Model
    {
        $colonne = static::colonneDiscriminante();
        $valeur = is_object($attributes) ? ($attributes->{$colonne} ?? null) : ($attributes[$colonne] ?? null);
        $classe = static::sousClasses()[$valeur] ?? static::class;

        $modele = (new $classe)->newInstance([], true);
        $modele->setRawAttributes((array) $attributes, true);
        $modele->setConnection($connection ?: $this->getConnectionName());
        $modele->fireModelEvent('retrieved', false);

        return $modele;
    }
}
