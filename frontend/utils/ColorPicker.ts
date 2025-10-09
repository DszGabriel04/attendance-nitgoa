// ColorPicker.ts
// Utility class to alternate between 16 colors for any list

export class ColorPicker {
  private colors: string[] = [
    '#516d78', '#1b52d0', '#da007a', '#f55c00', '#00a2ae', '#009842', '#a400e3', '#4072f3',
  ];

  getColor(index: number): string {
    return this.colors[index % this.colors.length];
  }

  getColorList(length: number): string[] {
    return Array.from({ length }, (_, i) => this.getColor(i));
  }
}
