import { test } from "../test_base";
import expect from "expect";
import { get_new_volumes, ChapterShowMode } from "./qd";
import type { Volume } from "../qdtypes";
import type { QdChapterSimpleInfo } from "../types";

const filename = 'utils/qd.test.ts';

export default function t() {
    test(filename, 'merge_volumes_1', () => {
        const sourceList: Volume[] = [
            {
                id: 'test',
                name: 'Test Volume',
                isVip: false,
                chapters: [
                    { id: 1, name: 'Chapter 1' },
                    { id: 2, name: 'Chapter 2' },
                ],
            },
        ];
        const targetList: QdChapterSimpleInfo[] = [
            {
                primaryKey: 0,
                id: 2,
                name: 'Chapter 2',
                bookId: 0,
                time: 10,
            },
            {
                primaryKey: 0,
                id: 3,
                name: 'Chapter 3',
                bookId: 0,
                time: 11,
            },
        ];
        expect(get_new_volumes(targetList, sourceList, ChapterShowMode.All)).toEqual([
            {
                id: 'vol_new',
                name: '其他已保存章节',
                isVip: false,
                chapters: [
                    { id: 3, name: 'Chapter 3', isSaved: true },
                ],
            },
            {
                id: 'test',
                name: 'Test Volume',
                isVip: false,
                chapters: [
                    { id: 1, name: 'Chapter 1' },
                    { id: 2, name: 'Chapter 2', isSaved: true },
                ],
            },
        ]);
        expect(get_new_volumes(targetList, sourceList, ChapterShowMode.SavedOnly)).toEqual([
            {
                id: 'vol_new',
                name: '其他已保存章节',
                isVip: false,
                chapters: [
                    { id: 3, name: 'Chapter 3' },
                ],
            },
            {
                id: 'test',
                name: 'Test Volume',
                isVip: false,
                chapters: [
                    { id: 2, name: 'Chapter 2' },
                ],
            },
        ]);
        expect(get_new_volumes(targetList, sourceList, ChapterShowMode.UnsavedOnly)).toEqual([
            {
                id: 'test',
                name: 'Test Volume',
                isVip: false,
                chapters: [
                    { id: 1, name: 'Chapter 1' },
                ],
            },
        ]);
    });
}
