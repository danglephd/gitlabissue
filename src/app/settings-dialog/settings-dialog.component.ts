import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.css']
})
export class SettingsDialogComponent implements OnInit {
  shuffleEnabled: boolean = false;
  loopEnabled: boolean = false;
  maxPlaylistSize: number = 50;

  constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>) { }

  ngOnInit(): void {
    // Load settings from localStorage
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const shuffleSetting = localStorage.getItem('shuffleEnabled');
    const loopSetting = localStorage.getItem('loopEnabled');
    const maxPlaylistSizeSetting = localStorage.getItem('maxPlaylistSize');

    this.shuffleEnabled = shuffleSetting === 'true';
    this.loopEnabled = loopSetting === 'true';
    this.maxPlaylistSize = maxPlaylistSizeSetting ? parseInt(maxPlaylistSizeSetting, 10) : 50;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(): void {
    localStorage.setItem('shuffleEnabled', this.shuffleEnabled.toString());
    localStorage.setItem('loopEnabled', this.loopEnabled.toString());
    localStorage.setItem('maxPlaylistSize', this.maxPlaylistSize.toString());

    this.dialogRef.close({
      shuffleEnabled: this.shuffleEnabled,
      loopEnabled: this.loopEnabled,
      maxPlaylistSize: this.maxPlaylistSize
    });
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.shuffleEnabled = false;
    this.loopEnabled = false;
    this.maxPlaylistSize = 50;
  }

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
