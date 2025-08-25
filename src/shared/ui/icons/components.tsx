/**
 * 개별 아이콘 컴포넌트
 * Tree-shakeable 구조로 필요한 아이콘만 import 가능
 */

import React from 'react';
import { Icon } from './Icon';
import { IconType, IconProps } from './types';

// Navigation Icons
export const ArrowUpIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ARROW_UP} />;
export const ArrowDownIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ARROW_DOWN} />;
export const ArrowLeftIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ARROW_LEFT} />;
export const ArrowRightIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ARROW_RIGHT} />;
export const ChevronUpIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHEVRON_UP} />;
export const ChevronDownIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHEVRON_DOWN} />;
export const ChevronLeftIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHEVRON_LEFT} />;
export const ChevronRightIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHEVRON_RIGHT} />;
export const MenuIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MENU} />;
export const CloseIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CLOSE} />;
export const HomeIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.HOME} />;
export const BackIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.BACK} />;

// Action Icons
export const AddIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ADD} />;
export const EditIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.EDIT} />;
export const DeleteIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.DELETE} />;
export const SaveIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SAVE} />;
export const CopyIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.COPY} />;
export const PasteIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PASTE} />;
export const CutIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CUT} />;
export const SearchIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SEARCH} />;
export const FilterIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FILTER} />;
export const SortIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SORT} />;
export const RefreshIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.REFRESH} />;
export const DownloadIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.DOWNLOAD} />;
export const UploadIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.UPLOAD} />;
export const ShareIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SHARE} />;
export const PrintIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PRINT} />;

// Media Icons
export const PlayIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PLAY} />;
export const PauseIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PAUSE} />;
export const StopIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.STOP} />;
export const RecordIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.RECORD} />;
export const FastForwardIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FAST_FORWARD} />;
export const RewindIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.REWIND} />;
export const VolumeUpIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.VOLUME_UP} />;
export const VolumeDownIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.VOLUME_DOWN} />;
export const VolumeMuteIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.VOLUME_MUTE} />;
export const FullscreenIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FULLSCREEN} />;
export const FullscreenExitIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FULLSCREEN_EXIT} />;
export const CameraIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CAMERA} />;
export const VideoIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.VIDEO} />;
export const ImageIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.IMAGE} />;
export const MicrophoneIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MICROPHONE} />;

// Status Icons
export const CheckIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHECK} />;
export const CheckCircleIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHECK_CIRCLE} />;
export const ErrorCircleIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ERROR_CIRCLE} />;
export const WarningIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.WARNING} />;
export const InfoIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.INFO} />;
export const HelpIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.HELP} />;
export const QuestionIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.QUESTION} />;
export const ExclamationIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.EXCLAMATION} />;
export const StarIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.STAR} />;
export const StarFilledIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.STAR_FILLED} />;
export const HeartIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.HEART} />;
export const HeartFilledIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.HEART_FILLED} />;
export const ThumbUpIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.THUMB_UP} />;
export const ThumbDownIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.THUMB_DOWN} />;

// User & Social Icons
export const UserIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.USER} />;
export const UsersIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.USERS} />;
export const UserAddIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.USER_ADD} />;
export const UserRemoveIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.USER_REMOVE} />;
export const ProfileIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PROFILE} />;
export const LoginIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LOGIN} />;
export const LogoutIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LOGOUT} />;
export const LockIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LOCK} />;
export const UnlockIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.UNLOCK} />;
export const KeyIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.KEY} />;
export const ShieldIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SHIELD} />;

// Communication Icons
export const MailIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MAIL} />;
export const MailOpenIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MAIL_OPEN} />;
export const SendIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SEND} />;
export const InboxIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.INBOX} />;
export const ChatIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHAT} />;
export const CommentIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.COMMENT} />;
export const NotificationIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.NOTIFICATION} />;
export const BellIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.BELL} />;

// File & Folder Icons
export const FileIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FILE} />;
export const FileAddIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FILE_ADD} />;
export const FileRemoveIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FILE_REMOVE} />;
export const FolderIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FOLDER} />;
export const FolderOpenIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FOLDER_OPEN} />;
export const FolderAddIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FOLDER_ADD} />;
export const DocumentIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.DOCUMENT} />;
export const PdfIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PDF} />;
export const ZipIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ZIP} />;

// Business & Data Icons
export const CalendarIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CALENDAR} />;
export const ClockIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CLOCK} />;
export const TimeIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.TIME} />;
export const ChartIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CHART} />;
export const GraphIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.GRAPH} />;
export const AnalyticsIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ANALYTICS} />;
export const DashboardIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.DASHBOARD} />;
export const BriefcaseIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.BRIEFCASE} />;
export const MoneyIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MONEY} />;
export const CreditCardIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CREDIT_CARD} />;

// UI Elements Icons
export const SettingsIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SETTINGS} />;
export const GearIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.GEAR} />;
export const ToolIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.TOOL} />;
export const GridIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.GRID} />;
export const ListIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LIST} />;
export const LayoutIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LAYOUT} />;
export const SidebarIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SIDEBAR} />;
export const ExpandIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.EXPAND} />;
export const CollapseIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.COLLAPSE} />;
export const MoreHorizontalIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MORE_HORIZONTAL} />;
export const MoreVerticalIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MORE_VERTICAL} />;
export const DragIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.DRAG} />;
export const PinIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PIN} />;
export const UnpinIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.UNPIN} />;

// Project Specific Icons
export const ProjectIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PROJECT} />;
export const PlanningIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PLANNING} />;
export const FeedbackIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FEEDBACK} />;
export const StoryboardIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.STORYBOARD} />;
export const TimelineIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.TIMELINE} />;
export const MilestoneIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MILESTONE} />;
export const TaskIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.TASK} />;
export const SubtaskIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SUBTASK} />;
export const ProgressIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PROGRESS} />;
export const CompleteIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.COMPLETE} />;
export const PendingIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.PENDING} />;
export const ArchivedIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ARCHIVED} />;

// Miscellaneous Icons
export const LinkIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LINK} />;
export const ExternalLinkIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.EXTERNAL_LINK} />;
export const AttachmentIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.ATTACHMENT} />;
export const TagIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.TAG} />;
export const BookmarkIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.BOOKMARK} />;
export const FlagIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.FLAG} />;
export const GlobeIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.GLOBE} />;
export const MapIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.MAP} />;
export const LocationIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.LOCATION} />;
export const WifiIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.WIFI} />;
export const BatteryIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.BATTERY} />;
export const CloudIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CLOUD} />;
export const CloudUploadIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CLOUD_UPLOAD} />;
export const CloudDownloadIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.CLOUD_DOWNLOAD} />;
export const SyncIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SYNC} />;
export const SpinnerIcon: React.FC<Omit<IconProps, 'type'>> = (props) => <Icon {...props} type={IconType.SPINNER} />;