import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numberShort' })
export class NumberShortPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '';
    if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1) + 'B';
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1) + 'K';
    return value.toString();
  }
}
