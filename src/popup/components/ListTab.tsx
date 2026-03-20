import { useRef } from "react";
import { groupByVideo } from "../../shared/storage";
import type { Bookmark, SortOption } from "../../shared/types";
import { BookmarkGroup } from "./BookmarkGroup";
import { SearchBar } from "./SearchBar";
import { SortSelect } from "./SortSelect";

interface Props {
	bookmarks: Bookmark[];
	search: string;
	setSearch: (s: string) => void;
	sort: SortOption;
	setSort: (s: SortOption) => void;
	remove: (id: string) => Promise<void>;
	doExport: () => Promise<void>;
	doImport: (file: File) => Promise<void>;
	importError: string | null;
}

export function ListTab({
	bookmarks,
	search,
	setSearch,
	sort,
	setSort,
	remove,
	doExport,
	doImport,
	importError,
}: Props) {
	const fileRef = useRef<HTMLInputElement>(null);
	const groups = groupByVideo(bookmarks);

	return (
		<div className="list-tab">
			<div className="list-controls">
				<SearchBar value={search} onChange={setSearch} />
				<SortSelect value={sort} onChange={setSort} />
			</div>
			<div className="list-actions">
				<button className="action-btn" onClick={doExport} type="button">
					Export
				</button>
				<button className="action-btn" onClick={() => fileRef.current?.click()} type="button">
					Import
				</button>
				<input
					ref={fileRef}
					type="file"
					accept=".json"
					hidden
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) doImport(file);
						e.target.value = "";
					}}
				/>
			</div>
			{importError && <div className="status-msg error">{importError}</div>}
			{bookmarks.length === 0 ? (
				<div className="empty-state">
					{search ? "No bookmarks match your search." : "No bookmarks yet. Start bookmarking!"}
				</div>
			) : (
				Array.from(groups.entries()).map(([videoId, items]) => (
					<BookmarkGroup
						key={videoId}
						videoTitle={items[0].videoTitle}
						thumbnailUrl={items[0].thumbnailUrl}
						bookmarks={items}
						onDelete={remove}
					/>
				))
			)}
		</div>
	);
}
