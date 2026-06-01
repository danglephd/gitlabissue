
/**
 * MasterTag represents a tag in the master tag database. Each tag has a unique id, a display name, and other metadata.
 * The master tag database is used to manage and standardize tags across the application.
 * It can be stored in Firebase/RealtimeDB or any other database solution.
 */
export interface MasterTag {
    /**
     * Unique tag id
     * Example:
     * "rap_viet"
     */
    id: string;

    /**
     * Normalized tag name
     * Example:
     * "rap viet"
     */
    name: string;

    /**
     * Display name for UI
     * Example:
     * "Rap Việt"
     */
    displayName: string;

    /**
     * Is tag active?
     * true  -> usable
     * false -> ignored
     */
    active: boolean;

    /**
     * Search aliases
     * Example:
     * {
     *   "rapviệt": true,
     *   "rapviet": true
     * }
     */
    aliases?: Record<string, boolean>;

    /**
     * Optional category
     * Example:
     * "music_genre"
     * "content_type"
     * "artist"
     */
    category?: string;

    /**
     * How many videos use this tag
     */
    usageCount?: number;

    /**
     * Created timestamp
     */
    createdAt: number;

    /**
     * Updated timestamp
     */
    updatedAt: number;
}