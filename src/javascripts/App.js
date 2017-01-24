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
        repos: [],
        owner: '',
    };

    focus = true;
    url = 'https://api.github.com/';

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
        // TODO:  TEMP hard code
        // window.Front.on('conversation', (data) => {
        //     // triggered when a conversation is loaded
        //     // return data.contact.id;
        //     // var user = data.contact.handle;
        //
        //     this.setState({
        //         // console: data.contact.handle,
        //         console: 'conversation loaded',
        //     });
        //
        //     window.Front.alert({
        //         title: 'Conversation was loaded',
        //         message: 'Body of the alert.',
        //         okTitle: 'Label of the OK button (optional)'
        //     }, function () {
        //         console.log('User clicked OK.');
        //     });
    };

    getIssues = () => {
        // GET /user/issues returns all issues ASSIGNED to user
        var github_url = this.url + 'issues';
        var payload = {
            "filter": "all",
            "state": "all",
        };

        $.ajax({
            url: github_url,
            type: 'get',
            data: payload,
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {

                var issues = [];
                response.forEach( (issue) => {
                    issues.push(issue);
                });
                this.setState({
                    issues: issues,
                });
            }
        });
    };

    // display form to add a new github issue
    showForm = () => {
        this.setState({
            new: true
        });

        // GET /user/repos
        var github_url = this.url + 'user/repos';

        $.ajax({
            url: github_url,
            type: 'get',
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {
                var repos = response.map( (repo) => {
                    return repo.name;
                });
                this.setState({
                    repos: repos,
                    owner: response.owner ? response.owner.login : 'loopDelicious',
                });
            }
        });

    };

    // POST request to create a new github issue
    handleForm = (e) => {
        e.preventDefault();

        var title = this.refs['title'].value;
        var body = this.refs['body'].value;
        var label = this.refs['labels'].value;
        var repo = this.refs['repos'].value;

        if (title && body && repo && label) {
            var github_url = this.url + 'repos/' + this.state.owner + '/' + repo + '/issues';
            var data = {
                "title": title,
                "body": body,
                "labels": [label],
            };

            $.ajax({
                url: github_url,
                type: 'post',
                data: JSON.stringify(data),
                headers: {
                    Authorization: 'token ' + this.refs.token.value,
                },
                contentType: 'application/json',
                success: (response) => {
                    console.log(response);
                    this.refs['user_form'].reset();
                    this.state.issues.unshift(response);
                    this.setState({
                        assignees: [],
                        issues: this.state.issues,
                    });
                }
            });
        } else {

            this.setState({
                error: 'Please enter Issue details.'
            });
        }
    };

    handleToggle = (issue) => {

        var github_url = issue.repository.url + '/issues/' + issue.number;

        var data = {
            state: issue.state === 'open' ? 'closed' : 'open',
        };

        $.ajax({
            url: github_url,
            type: 'PATCH',
            data: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {

                this.state.issues[this.getIssueIndex(response.number)].state = response.state;

                this.setState({
                    issues: this.state.issues,
                });
            }
        });
    };

    getIssueIndex = (issueNumber) => {
        var tempIssuesIndex = this.state.issues.map( (issue) => {
            return issue.number;
        });

        var index = tempIssuesIndex.indexOf(issueNumber);

        return index;

    };

    listAssignees = (issue) => {

        var github_url = issue.repository.url + '/assignees';

        $.ajax({
            url: github_url,
            type: 'get',
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {
                this.setState({
                    assignees: response,
                });
            }

        });
    };

    handleReassign = (issue, e) => {

        var github_url = issue.repository.url + '/issues/' + issue.number;
        var data = {
            assignee: e.target.value,
        };

        $.ajax({
            url: github_url,
            type: 'patch',
            data: JSON.stringify(data),
            headers: {
                Authorization: 'token ' + this.refs.token.value,
            },
            contentType: 'application/json',
            success: (response) => {
                console.log(response);
            }
        });
    };

    render() {

        var issues = this.state.issues.map( (issue) => {

            var listItems = this.state.assignees.map( (person) => {
                return <option key={person.id} >{person.login}</option>
            });

            return (
                <li className="listed-issues cf" key={issue.id}>
                    #{issue.number} <a href={issue.html_url} target="_blank"> {issue.title} </a><br/>

                    <button className={'btn ' + (issue.state === 'open' ? 'close-button' : 'open-button')} onClick={this.handleToggle.bind(this, issue)}>{ issue.state === 'open' ? 'Close' : 'Reopen' }</button>

                    <div className="dropdown">
                        <select className="dropdown-content" onClick={this.listAssignees.bind(this, issue)} onChange={this.handleReassign.bind(this, issue)}>
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

        var repositories = this.state.repos.map( (repo) => {
            return <option key={repo} >{repo}</option>
        });

        return (
            <div className="App">

                <input type="text" placeholder="personal access token" ref="token" defaultValue={key.githubToken} onChange={this.getIssues} autoFocus={this.focus} /><br/>

                <div>
                    <h4>Current issues</h4>
                    <button onClick={function(){window.location.reload();}}>Refresh</button>
                    <ul id="github-issues">
                        {issues ? issues : <br/>}
                        <button id='add-button' onClick={this.showForm}><i className="fa fa-plus" /></button>
                        <h4>new issue</h4>
                    </ul>

                </div>

                {this.state.new ?
                <form id="new-input" className='cf' ref="user_form" onSubmit={this.handleForm} >
                    <input type="text" placeholder="Issue title" ref="title" /><br/>
                    <input type="text" placeholder="Issue body" ref="body" /><br/>
                    <div className="dropdown">
                        <select className="dropdown-content" ref='labels' >
                            <option value="" disabled selected >Labels</option>
                            {labels}
                        </select>
                        <select className="dropdown-content" ref='repos' >
                            <option value="" disabled selected >Repos</option>
                            {repositories}
                        </select>
                    </div>
                    {this.state.error ? <div><span>{this.state.error}</span><br/></div> : null}
                    <button id="new-issue" type='submit' >Add to GitHub</button>
                </form>
                    : null }
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

