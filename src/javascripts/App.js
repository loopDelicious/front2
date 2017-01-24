import React, { Component } from 'react';
import '../css/App.css';
import $ from 'jquery';
import key from '../../secrets.js';



class App extends Component {

    state = {
        issues: [],
        error: null,
        new: false,
        assignees: [],
        labels: ['bug', 'duplicate', 'enhancement', 'help wanted', 'invalid', 'question', 'wont fix'],
        console: 'initial load',
    };

    focus = true;
    url = 'https://api.github.com/';

    // display a list of github issues
    componentDidMount = () => {

        this.setState({
            // console: data.contact.handle,
            console: 'react component mounted'
        });


        window.Front.on('no_conversation', () => {

            this.setState({
                // console: data.contact.handle,
                console: 'no_conversation loaded',
            });
        });

        window.Front.on('conversation', (data) => {
            // triggered when a conversation is loaded
            // return data.contact.id;
            // var user = data.contact.handle;

            this.setState({
                // console: data.contact.handle,
                console: 'conversation loaded',
            });

            window.Front.alert({
                title: 'Conversation was loaded',
                message: 'Body of the alert.',
                okTitle: 'Label of the OK button (optional)'
            }, function () {
                console.log('User clicked OK.');
            });

            // GET /user/issues returns all issues ASSIGNED to user
            // var github_url = this.url + 'issues';
            // // var url = 'https://api.github.com/repos/loopDelicious/front2/issues';
            // var payload = {
            //     "filter": "created",
            // };
            //
            // $.ajax({
            //     url: github_url,
            //     type: 'get',
            //     // body: payload,
            //     headers: {
            //         Authorization: 'token ' + key.githubToken,
            //     },
            //     contentType: 'application/json',
            //     success: (response) => {
            //
            //         var issues = [];
            //         response.forEach( (issue) => {
            //             issues.push(issue);
            //         });
            //         this.setState({
            //             issues: issues,
            //         });
            //     }
            // });
        });
    };

    // display form to add a new github issue
    showForm = () => {
        this.setState({
            new: true
        });
    };

    // POST request to create a new github issue
    handleForm = (e) => {
        e.preventDefault();

        var title = this.refs['title'].value;
        var body = this.refs['body'].value;
        var label = this.refs['labels'].value;

        if (title && body) {
            var url = 'https://api.github.com/repos/loopDelicious/front2/issues';
            var data = {
                "title": title,
                "body": body,
                "labels": label
            };

            $.ajax({
                url: url,
                type: 'post',
                body: JSON.stringify(data),
                headers: {
                    Authorization: 'token ' + key.githubToken,
                },
                contentType: 'application/json',
                success: (response) => {
                    console.log(response);
                    this.refs['user_form'].reset();
                    this.setState({
                        assignees: [],
                    });
                }
            });
        } else {

            this.setState({
                error: 'Please enter Issue details.'
            });
        }
    };

    handleClose = (issue) => {

        var url = 'https://api.github.com/repos/loopDelicious/front2/issues/' + issue.number;
        var data = {
            state: 'close',
        };

        $.ajax({
            url: url,
            type: 'patch',
            body: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + key.githubToken,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
                // this.componentDidMount();
            }
        });
    };

    handleOpen = (issue) => {

        var url = 'https://api.github.com/repos/loopDelicious/front2/issues/' + issue.number;
        var data = {
            state: 'open',
        };

        $.ajax({
            url: url,
            type: 'patch',
            body: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + key.githubToken,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
                // this.componentDidMount();
            }
        });
    };

    listAssignees = (issue) => {

        var url = 'https://api.github.com/repos/loopDelicious/front2/assignees';

        $.ajax({
            url: url,
            type: 'get',
            headers: {
                Authorization: 'token ' + key.githubToken,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
                this.setState({
                    assignees: response,
                })
            }
        });
    };

    handleReassign = (issue, assignee) => {

        var url = 'https://api.github.com/repos/loopDelicious/front2/issues' + issue.number;
        var data = {
            assignee: assignee,
        };

        $.ajax({
            url: url,
            type: 'patch',
            body: data,
            headers: {
                Authorization: 'token ' + key.githubToken,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);

                // this.componentDidMount();
            }
        });
    };

    render() {

        var issues = this.state.issues.map( (issue) => {

            var listItems = this.state.assignees.map( (person) => {
                return <option key={person} >{person}</option>
            });

            return (
                <li className="listed-issues" key={issue.number}>
                    <a href={issue.html_url} target="_blank">Issue #{issue.number} {issue.title} </a>
                    {issue.state === 'open' ?
                        <a href="#" className='edit-link' onClick={this.handleClose.bind(this, issue)}> Close </a>
                        :
                        <a href="#" className='edit-link' onClick={this.handleOpen.bind(this, issue)}>Open</a>
                    }
                    <div className="dropdown">
                        <select className="dropdown-content" ref='assignee' onChange={this.listAssignees}>
                            <option value="" disabled selected >{issue.assignee ? issue.assignee.login : 'Assign'}</option>
                            {listItems}
                        </select>
                    </div>
                </li>
            )
        });

        var labels = this.state.labels.map( (label) => {
            return <option key={label} >{label}</option>
        });

        return (
            <div className="App">

                <div>
                    <h4>Current issues</h4>
                    <button onClick={function(){window.location.reload();}}>Refresh</button>
                    <ul id="github-issues">
                        {issues ? issues : <br/>}
                        <button id='add-button' onClick={this.showForm}><i className="fa fa-plus" /></button>
                    </ul>

                </div>

                {this.state.new ?
                <form id="new-input" ref="user_form" onSubmit={this.handleForm} >
                    <h4>Create a new issue</h4>
                    <input type="text" placeholder="Issue title" ref="title" autoFocus={this.focus} /><br/>
                    <input type="text" placeholder="Issue body" ref="body" /><br/>
                    <div className="dropdown">
                        <select className="dropdown-content" ref='labels' >
                            <option value="" disabled selected >Labels</option>
                            {labels}
                        </select>
                    </div>
                    {this.state.error ? <div><span>{this.state.error}</span><br/></div> : null}
                    <button id="new-issue" type='submit' >Add to GitHub</button>
                </form>
                    : null }
                <span>{this.state.console}</span>
            </div>
        );
    }
}

export default App;

// var url = 'https://github.com/login/oauth/authorize';
// window.Front.openUrl(url);
//
// Front.on('conversation', function(data) {
//     console.log('Conversation', data.conversation);
//     console.log('Contact', data.contact);
//     console.log('Message', data.message);
//     console.log('OtherMessages', data.otherMessages);
//     conversation = data.conversation;
// });

