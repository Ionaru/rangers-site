/* eslint-disable @typescript-eslint/naming-convention */
export interface IEnjinRequestParams {
    [key: string]: string;
}

export interface IEnjinRequest {
    id: string;
    jsonrpc: string;
    params: IEnjinRequestParams;
    method: string;
}

export interface IEnjinResponse {
    id: string;
    jsonrpc: string;
}

export interface IEnjinErrorResponse extends IEnjinResponse {
    error: {
        code: number;
        message: string;
    };
}

export interface IEnjinSuccessResponse<T> extends IEnjinResponse {
    result: T;
}

export type IResponse<T> = IEnjinSuccessResponse<T> | IEnjinErrorResponse;

export interface ITagType {
    tag_id: string;
    tagname: string;
    numusers: string;
    visible: string;
}

export interface ITagTypes {
    [id: string]: ITagType;
}

export interface IUsers {
    [id: string]: IUser;
}

export interface IUser {
    username: string;
    forum_post_count: string;
    forum_votes: string;
    lastseen: string;
    datejoined: string;
    points_total: null | string;
    points_day: null | string;
    points_week: null | string;
    points_month: null | string;
    points_forum: null | string;
    points_purchase: null | string;
    points_other: null | string;
    points_spent: null | string;
    points_decayed: null | string;
    points_adjusted: null | string;
}

export type IUserTags = IUserTag[];

export interface IUserTag {
    tag_id: string;
    site_id: string;
    expiry_time: string;
    tagname: string;
    numusers: string;
    visible: string;
    have_image: string;
    ordering: string;
    show_area: string;
    tag_color: string;
    tag_color_username: string;
    tag_url: string;
    tag_url_newwindow: string;
    tag_background: string;
    tag_prefix: string;
    tag_prefix_color: string;
    tag_post_color: string;
    tag_post_opacity: string;
    tag_post_bg_color: string;
    tag_background_color: string;
    microtag_text: string;
    microtag_text_color: string;
    microtag_bg_color: string;
    microtag_bg_style: string;
    microtag_image: string;
    microtag_icon: string;
    tag_forum_title: string;
    category_id: string;
    award_status: string;
    award_name: string;
    award_group: string;
    award_large_image: string;
    award_small_image: string;
    award_large_bg: string;
    award_display: string;
    award_description: string;
    award_sort: string;
    award_wall_post: string;
    category_order: string;
    url: string;
}
