<?php

namespace Seed;

use Seed\Core\Json\JsonSerializableType;
use Seed\Core\Json\JsonProperty;
use Seed\Core\Types\ArrayType;

class SearchResponse extends JsonSerializableType
{
    /**
     * @var ?array<string> $results
     */
    #[JsonProperty('results'), ArrayType(['string'])]
    public ?array $results;

    /**
     * @param array{
     *   results?: ?array<string>,
     * } $values
     */
    public function __construct(
        array $values = [],
    ) {
        $this->results = $values['results'] ?? null;
    }

    /**
     * @return string
     */
    public function __toString(): string
    {
        return $this->toJson();
    }
}
